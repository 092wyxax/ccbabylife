import 'server-only'
import { and, asc, eq, lte } from 'drizzle-orm'
import { db } from '@/db/client'
import { subscriptions, type Subscription } from '@/db/schema/subscriptions'
import { products, customers, orders, orderItems } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { shippingFee, FREE_SHIP_THRESHOLD_TWD } from '@/lib/pricing'

export type Frequency = 'monthly' | 'bimonthly' | 'quarterly'

const FREQ_DAYS: Record<Frequency, number> = {
  monthly: 30,
  bimonthly: 60,
  quarterly: 90,
}

export function computeNextRun(from: Date, frequency: Frequency): Date {
  const next = new Date(from)
  next.setUTCDate(next.getUTCDate() + FREQ_DAYS[frequency])
  return next
}

export async function listSubscriptionsForCustomer(customerId: string): Promise<Subscription[]> {
  return db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.orgId, DEFAULT_ORG_ID),
        eq(subscriptions.customerId, customerId)
      )
    )
    .orderBy(asc(subscriptions.nextRunAt))
}

export async function getSubscription(id: string): Promise<Subscription | null> {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.id, id), eq(subscriptions.orgId, DEFAULT_ORG_ID)))
    .limit(1)
  return row ?? null
}

export interface CreateSubscriptionInput {
  customerId: string
  frequency: Frequency
  lines: Array<{ productId: string; quantity: number }>
  notes?: string
}

export async function createSubscription(input: CreateSubscriptionInput): Promise<Subscription> {
  if (input.lines.length === 0) throw new Error('訂閱必須至少包含一個商品')
  const nextRun = computeNextRun(new Date(), input.frequency)
  const [row] = await db
    .insert(subscriptions)
    .values({
      orgId: DEFAULT_ORG_ID,
      customerId: input.customerId,
      frequency: input.frequency,
      lines: input.lines,
      nextRunAt: nextRun,
      notes: input.notes ?? null,
    })
    .returning()
  return row
}

export async function pauseSubscription(id: string, customerId: string): Promise<void> {
  await db
    .update(subscriptions)
    .set({ status: 'paused', updatedAt: new Date() })
    .where(
      and(
        eq(subscriptions.id, id),
        eq(subscriptions.customerId, customerId),
        eq(subscriptions.orgId, DEFAULT_ORG_ID)
      )
    )
}

export async function resumeSubscription(id: string, customerId: string): Promise<void> {
  await db
    .update(subscriptions)
    .set({ status: 'active', updatedAt: new Date() })
    .where(
      and(
        eq(subscriptions.id, id),
        eq(subscriptions.customerId, customerId),
        eq(subscriptions.orgId, DEFAULT_ORG_ID)
      )
    )
}

export async function cancelSubscription(id: string, customerId: string): Promise<void> {
  await db
    .update(subscriptions)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(
      and(
        eq(subscriptions.id, id),
        eq(subscriptions.customerId, customerId),
        eq(subscriptions.orgId, DEFAULT_ORG_ID)
      )
    )
}

function makeOrderNumber(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const seq = String(now.getTime()).slice(-6)
  return `S${date}${seq}` // S prefix = subscription-derived
}

/**
 * Process all subscriptions whose nextRunAt is past and status is active.
 * Creates a new order per subscription (status pending_payment) using the
 * lines + current product prices, advances nextRunAt, queues notification.
 */
export async function processDueSubscriptions(): Promise<{
  matched: number
  ordered: number
  failed: number
}> {
  const now = new Date()
  const dueRows = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.orgId, DEFAULT_ORG_ID),
        eq(subscriptions.status, 'active'),
        lte(subscriptions.nextRunAt, now)
      )
    )
    .limit(100)

  if (dueRows.length === 0) return { matched: 0, ordered: 0, failed: 0 }

  let ordered = 0
  let failed = 0

  for (const sub of dueRows) {
    try {
      const productIds = sub.lines.map((l) => l.productId)
      const productRows = await db
        .select()
        .from(products)
        .where(eq(products.orgId, DEFAULT_ORG_ID))
      const byId = new Map(productRows.map((p) => [p.id, p]))

      const lineItems = sub.lines
        .map((l) => {
          const p = byId.get(l.productId)
          if (!p || p.status !== 'active') return null
          return {
            product: p,
            quantity: l.quantity,
            lineTotal: p.priceTwd * l.quantity,
            weight: p.weightG * l.quantity,
          }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)

      if (lineItems.length === 0) {
        // No usable products → skip this run, advance next run
        await db
          .update(subscriptions)
          .set({
            nextRunAt: computeNextRun(now, sub.frequency as Frequency),
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, sub.id))
        failed++
        continue
      }

      const subtotal = lineItems.reduce((s, l) => s + l.lineTotal, 0)
      const totalWeight = lineItems.reduce((s, l) => s + l.weight, 0)
      const ship = shippingFee(totalWeight)
      const computedShipBase = ship < 0 ? 0 : ship
      const computedShip = subtotal >= FREE_SHIP_THRESHOLD_TWD ? 0 : computedShipBase
      const total = subtotal + computedShip

      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, sub.customerId))
        .limit(1)
      if (!customer) continue

      const [order] = await db
        .insert(orders)
        .values({
          orgId: DEFAULT_ORG_ID,
          orderNumber: makeOrderNumber(),
          customerId: sub.customerId,
          status: 'pending_payment',
          paymentStatus: 'pending',
          subtotal,
          shippingFee: computedShip,
          tax: 0,
          storeCreditUsed: 0,
          total,
          recipientEmail: customer.email,
          recipientLineId: customer.lineUserId,
          isPreorder: lineItems.some((l) => l.product.stockType === 'preorder'),
          notes: `自動訂閱訂單 (subscription ${sub.id}, run #${sub.runCount + 1})`,
        })
        .returning()

      await db.insert(orderItems).values(
        lineItems.map((l) => ({
          orgId: DEFAULT_ORG_ID,
          orderId: order.id,
          productId: l.product.id,
          productNameSnapshot: l.product.nameZh,
          priceTwdSnapshot: l.product.priceTwd,
          quantity: l.quantity,
          lineTotal: l.lineTotal,
        }))
      )

      // Notify customer to pay
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ccbabylife.com'
      const body = `你的訂閱已下單 ✓\n\n訂單編號：${order.orderNumber}\n金額：NT$${total.toLocaleString()}\n\n請完成付款：\n${siteUrl}/pay/${order.id}`

      const { enqueuePush, queueAndSendLine } = await import('./NotificationService')
      const prefs = customer.notificationPrefs ?? { line: true, email: true }
      if (prefs.line && customer.lineUserId) {
        await queueAndSendLine({
          customerId: customer.id,
          templateId: 'subscription.run',
          body,
          payload: { orderId: order.id, subscriptionId: sub.id },
        }).catch(() => {})
      }
      if (prefs.email) {
        await enqueuePush({
          customerId: customer.id,
          channel: 'email',
          templateId: 'subscription.run',
          subject: `訂閱訂單已建立 · ${order.orderNumber}`,
          body,
          payload: { orderId: order.id, subscriptionId: sub.id },
        }).catch(() => {})
      }

      await db
        .update(subscriptions)
        .set({
          nextRunAt: computeNextRun(now, sub.frequency as Frequency),
          lastRunAt: now,
          runCount: sub.runCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, sub.id))

      ordered++
    } catch (e) {
      console.error('[processDueSubscriptions] failed for', sub.id, e)
      failed++
    }
  }

  return { matched: dueRows.length, ordered, failed }
}
