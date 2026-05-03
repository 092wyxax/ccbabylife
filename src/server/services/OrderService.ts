import 'server-only'
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { paged, type Paged, type PageParams } from '@/lib/pagination'
import {
  orders,
  orderItems,
  orderStatusLogs,
  customers,
  adminUsers,
  type Order,
  type OrderItem,
  type OrderStatusLog,
  type Customer,
  type AdminUser,
} from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import type { OrderStatus } from '@/db/schema'
import {
  canTransition,
  InvalidStatusTransitionError,
  TRANSITIONS,
} from '@/lib/order-state-machine'
import { LINE_TEMPLATES, renderTemplate } from '@/lib/line-templates'
import { queueAndSendLine } from '@/server/services/NotificationService'

const STATUS_TO_TEMPLATE: Partial<Record<OrderStatus, string>> = {
  paid: 'L2-paid',
  sourcing_jp: 'L2-sourcing',
  shipped: 'L7-shipped',
}

function formatDateForTemplate(d: Date): string {
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${m}/${day}`
}

async function sendStatusNotification(
  order: Order,
  newStatus: OrderStatus
): Promise<void> {
  if (!order.customerId) return
  const tmplId = STATUS_TO_TEMPLATE[newStatus]
  if (!tmplId) return

  const tmpl = LINE_TEMPLATES.find((t) => t.id === tmplId)
  if (!tmpl) return

  const [customer] = await db
    .select({ name: customers.name, prefs: customers.notificationPrefs })
    .from(customers)
    .where(eq(customers.id, order.customerId))
    .limit(1)
  if (!customer?.prefs?.line) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const trackingUrl = `${siteUrl}/track/${order.id}`
  const expectedDelivery = order.expectedDelivery
    ? formatDateForTemplate(new Date(order.expectedDelivery))
    : '—'

  const vars: Record<string, string> = {
    customer_name: customer.name ?? '妳',
    order_number: order.orderNumber,
    order_total: `NT$${order.total.toLocaleString('en-US')}`,
    tracking_url: trackingUrl,
    tracking_no: '—',
    date_jp_order: '—',
    date_received_jp: '—',
    date_shipping_intl: '—',
    date_arrived_tw: '—',
    date_expected_delivery: expectedDelivery,
    date_arrival: expectedDelivery,
  }

  const body = renderTemplate(tmpl.body, vars)
  try {
    await queueAndSendLine({
      customerId: order.customerId,
      templateId: tmpl.id,
      body,
      payload: { orderId: order.id, status: newStatus },
    })
  } catch {
    // queueAndSendLine swallows network errors internally; outer catch is
    // belt-and-suspenders so order status update never rolls back due to LINE.
  }
}

export { canTransition, InvalidStatusTransitionError }

export async function changeStatus(
  orderId: string,
  to: OrderStatus,
  actor: AdminUser,
  reason?: string
) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) })
  if (!order) throw new Error(`Order not found: ${orderId}`)

  if (!canTransition(order.status, to)) {
    throw new InvalidStatusTransitionError(order.status, to)
  }

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ status: to, updatedAt: new Date() })
      .where(eq(orders.id, orderId))

    await tx.insert(orderStatusLogs).values({
      orgId: order.orgId,
      orderId,
      fromStatus: order.status,
      toStatus: to,
      actorId: actor.id,
      reason,
    })
  })

  // Fire-and-forget LINE notification. Failure does not roll back status change.
  void sendStatusNotification(order, to)

  return { from: order.status, to }
}

export function listValidNextStatuses(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from]
}

export interface OrderListRow {
  order: Order
  customer: Customer | null
}

export async function listOrdersForAdmin(opts: {
  search?: string
  status?: OrderStatus
  page: PageParams
}): Promise<Paged<OrderListRow>> {
  const conds = [eq(orders.orgId, DEFAULT_ORG_ID)]
  if (opts.status) conds.push(eq(orders.status, opts.status))
  if (opts.search) {
    const q = `%${opts.search}%`
    conds.push(
      or(
        ilike(orders.orderNumber, q),
        ilike(orders.recipientEmail, q),
        ilike(customers.name, q),
        ilike(customers.email, q)
      )!
    )
  }

  const where = and(...conds)

  const [rows, totalRow] = await Promise.all([
    db
      .select({ order: orders, customer: customers })
      .from(orders)
      .leftJoin(customers, eq(customers.id, orders.customerId))
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(opts.page.pageSize)
      .offset(opts.page.offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .leftJoin(customers, eq(customers.id, orders.customerId))
      .where(where),
  ])

  return paged(rows, totalRow[0]?.count ?? 0, opts.page)
}

export interface OrderDetail {
  order: Order
  customer: Customer | null
  items: OrderItem[]
  logs: Array<OrderStatusLog & { actorName: string | null }>
}

export async function getOrderForAdmin(orderId: string): Promise<OrderDetail | null> {
  const orderRow = await db
    .select({ order: orders, customer: customers })
    .from(orders)
    .leftJoin(customers, eq(customers.id, orders.customerId))
    .where(and(eq(orders.id, orderId), eq(orders.orgId, DEFAULT_ORG_ID)))
    .limit(1)

  const row = orderRow[0]
  if (!row) return null

  const [items, logs] = await Promise.all([
    db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))
      .orderBy(asc(orderItems.createdAt)),
    db
      .select({
        log: orderStatusLogs,
        actor: adminUsers,
      })
      .from(orderStatusLogs)
      .leftJoin(adminUsers, eq(adminUsers.id, orderStatusLogs.actorId))
      .where(eq(orderStatusLogs.orderId, orderId))
      .orderBy(asc(orderStatusLogs.createdAt)),
  ])

  return {
    order: row.order,
    customer: row.customer,
    items,
    logs: logs.map((l) => ({ ...l.log, actorName: l.actor?.name ?? null })),
  }
}

/**
 * Customer-facing detail (for /track/[orderId]). Excludes admin-only fields
 * such as ECPay trade no and customer phone.
 */
export interface OrderTrackingDetail {
  order: Order
  items: OrderItem[]
}

export async function getOrderForTracking(
  orderId: string
): Promise<OrderTrackingDetail | null> {
  const detail = await getOrderForAdmin(orderId)
  if (!detail) return null
  return { order: detail.order, items: detail.items }
}
