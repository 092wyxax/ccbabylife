import 'server-only'
import { and, asc, eq, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  coupons,
  type Coupon,
  type CouponType,
  type CouponAutoIssue,
} from '@/db/schema/coupons'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

export { validateCoupon, type CouponValidation } from '@/lib/coupon-validation'

export interface CouponInput {
  code: string
  type: CouponType
  value: number
  description?: string | null
  minOrderTwd?: number
  maxUses?: number | null
  perUserLimit?: number | null
  startsAt?: Date | null
  expiresAt?: Date | null
  applicableProductIds?: string[]
  applicableCategorySlugs?: string[]
  autoIssueOn?: CouponAutoIssue
  isActive?: boolean
  notes?: string | null
}

export async function listCoupons(): Promise<Coupon[]> {
  return db
    .select()
    .from(coupons)
    .where(eq(coupons.orgId, DEFAULT_ORG_ID))
    .orderBy(asc(coupons.code))
}

export async function getCouponById(id: string): Promise<Coupon | null> {
  const [row] = await db
    .select()
    .from(coupons)
    .where(and(eq(coupons.orgId, DEFAULT_ORG_ID), eq(coupons.id, id)))
    .limit(1)
  return row ?? null
}

export async function findActiveCouponByCode(code: string): Promise<Coupon | null> {
  const [row] = await db
    .select()
    .from(coupons)
    .where(
      and(
        eq(coupons.orgId, DEFAULT_ORG_ID),
        eq(coupons.code, code.toUpperCase()),
        eq(coupons.isActive, true)
      )
    )
    .limit(1)
  return row ?? null
}

function rowFromInput(input: CouponInput) {
  return {
    code: input.code.toUpperCase(),
    type: input.type,
    value: input.value,
    description: input.description ?? null,
    minOrderTwd: input.minOrderTwd ?? 0,
    maxUses: input.maxUses ?? null,
    perUserLimit: input.perUserLimit ?? null,
    startsAt: input.startsAt ?? null,
    expiresAt: input.expiresAt ?? null,
    applicableProductIds: input.applicableProductIds ?? [],
    applicableCategorySlugs: input.applicableCategorySlugs ?? [],
    autoIssueOn: input.autoIssueOn ?? 'manual',
    isActive: input.isActive ?? true,
    notes: input.notes ?? null,
  }
}

export async function createCoupon(input: CouponInput): Promise<Coupon> {
  const [row] = await db
    .insert(coupons)
    .values({
      orgId: DEFAULT_ORG_ID,
      ...rowFromInput(input),
    })
    .returning()
  return row
}

export async function updateCoupon(id: string, input: CouponInput): Promise<Coupon> {
  const [row] = await db
    .update(coupons)
    .set({ ...rowFromInput(input), updatedAt: new Date() })
    .where(and(eq(coupons.orgId, DEFAULT_ORG_ID), eq(coupons.id, id)))
    .returning()
  return row
}

export async function deleteCoupon(id: string): Promise<void> {
  await db
    .delete(coupons)
    .where(and(eq(coupons.orgId, DEFAULT_ORG_ID), eq(coupons.id, id)))
}

export async function toggleCouponActive(id: string): Promise<Coupon> {
  const [existing] = await db
    .select()
    .from(coupons)
    .where(and(eq(coupons.id, id), eq(coupons.orgId, DEFAULT_ORG_ID)))
    .limit(1)
  if (!existing) throw new Error('Coupon not found')

  const [row] = await db
    .update(coupons)
    .set({ isActive: !existing.isActive, updatedAt: new Date() })
    .where(eq(coupons.id, id))
    .returning()
  return row
}

export async function incrementCouponUsage(id: string): Promise<void> {
  await db
    .update(coupons)
    .set({ usedCount: sql`${coupons.usedCount} + 1`, updatedAt: new Date() })
    .where(eq(coupons.id, id))
}

/* ---------- 發券給指定客戶（後台手動 / AI 提案確認後共用） ---------- */

export function describeCoupon(c: Coupon): string {
  const twd = (n: number) => `NT$${n.toLocaleString()}`
  if (c.type === 'free_shipping') return '免運優惠'
  if (c.type === 'percent') return `${c.value}% 折扣`
  if (c.type === 'tiered') return `滿 ${twd(c.minOrderTwd)} 折 ${twd(c.value)}`
  return `折抵 ${twd(c.value)}`
}

async function notifyCouponGranted(coupon: Coupon, customerIds: string[]): Promise<void> {
  const { customers } = await import('@/db/schema/customers')
  const { inArray } = await import('drizzle-orm')
  const { enqueuePush, queueAndSendLine } = await import('./NotificationService')

  const recipients = await db
    .select({
      id: customers.id,
      lineUserId: customers.lineUserId,
      notificationPrefs: customers.notificationPrefs,
    })
    .from(customers)
    .where(and(eq(customers.orgId, DEFAULT_ORG_ID), inArray(customers.id, customerIds)))

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ccbabylife.com'
  const desc = describeCoupon(coupon)
  const expiresLine = coupon.expiresAt
    ? `\n有效期限：${new Date(coupon.expiresAt).toLocaleDateString('zh-Hant')}`
    : ''
  const body = `你收到一張新優惠券 🎁\n\n代碼：${coupon.code}\n優惠：${desc}${expiresLine}\n\n到會員中心查看：${siteUrl}/account/coupons`

  for (const r of recipients) {
    const prefs = r.notificationPrefs ?? { line: true, email: true }
    if (prefs.line && r.lineUserId) {
      await queueAndSendLine({
        customerId: r.id,
        templateId: 'coupon.granted',
        body,
        payload: { couponId: coupon.id, code: coupon.code },
      }).catch(() => {})
    }
    if (prefs.email) {
      await enqueuePush({
        customerId: r.id,
        channel: 'email',
        templateId: 'coupon.granted',
        subject: `你收到一張新優惠券：${coupon.code}`,
        body,
        payload: { couponId: coupon.id, code: coupon.code },
      }).catch(() => {})
    }
  }
}

export interface GrantResult {
  granted: number
  alreadyHad: number
}

/**
 * 發券給指定客戶：驗證客戶屬於本 org、跳過已領過的、寫入並通知（LINE/Email）。
 * 呼叫端負責權限檢查。
 */
export async function grantCouponToCustomers(
  couponId: string,
  customerIds: string[]
): Promise<GrantResult> {
  const { customers } = await import('@/db/schema/customers')
  const { customerCoupons } = await import('@/db/schema/customer_coupons')
  const { inArray } = await import('drizzle-orm')

  const coupon = await getCouponById(couponId)
  if (!coupon) throw new Error('找不到此優惠券')

  const verified = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.orgId, DEFAULT_ORG_ID), inArray(customers.id, customerIds)))
  const verifiedIds = verified.map((v) => v.id)

  const existing = verifiedIds.length
    ? await db
        .select({ customerId: customerCoupons.customerId })
        .from(customerCoupons)
        .where(
          and(
            eq(customerCoupons.couponId, couponId),
            inArray(customerCoupons.customerId, verifiedIds)
          )
        )
    : []
  const existingSet = new Set(existing.map((e) => e.customerId))
  const toInsert = verifiedIds.filter((id) => !existingSet.has(id))

  if (toInsert.length > 0) {
    await db.insert(customerCoupons).values(
      toInsert.map((id) => ({ orgId: DEFAULT_ORG_ID, customerId: id, couponId }))
    )
    await notifyCouponGranted(coupon, toInsert).catch((err) => {
      console.error('[grantCouponToCustomers] notification failed:', err)
    })
  }

  return { granted: toInsert.length, alreadyHad: existingSet.size }
}
