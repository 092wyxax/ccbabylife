import 'server-only'
import { and, eq, gt, inArray, isNull, lte, or, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { coupons, type CouponAutoIssue } from '@/db/schema/coupons'
import { customerCoupons } from '@/db/schema/customer_coupons'
import { customers } from '@/db/schema/customers'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { enqueuePush, queueAndSendLine } from './NotificationService'
import { formatTwd } from '@/lib/format'

interface AutoIssueResult {
  issuedCount: number
  couponCodes: string[]
}

/**
 * Find all active coupons with the given autoIssueOn trigger and grant
 * them to the given customers. Skips already-granted (unique constraint).
 * Sends LINE + email notifications when wired.
 */
export async function issueAutoCoupons(
  trigger: Exclude<CouponAutoIssue, 'manual'>,
  customerIds: string[]
): Promise<AutoIssueResult> {
  if (customerIds.length === 0) return { issuedCount: 0, couponCodes: [] }

  const now = new Date()

  // Find active coupons matching trigger that haven't expired and haven't reached maxUses
  const matching = await db
    .select()
    .from(coupons)
    .where(
      and(
        eq(coupons.orgId, DEFAULT_ORG_ID),
        eq(coupons.autoIssueOn, trigger),
        eq(coupons.isActive, true),
        or(isNull(coupons.expiresAt), gt(coupons.expiresAt, now)),
        or(isNull(coupons.startsAt), lte(coupons.startsAt, now))
      )
    )

  if (matching.length === 0) return { issuedCount: 0, couponCodes: [] }

  let issuedCount = 0
  const issuedPairs: Array<{ couponId: string; customerId: string }> = []

  for (const coupon of matching) {
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) continue

    const rows = customerIds.map((customerId) => ({
      orgId: DEFAULT_ORG_ID,
      customerId,
      couponId: coupon.id,
    }))

    // ON CONFLICT DO NOTHING via raw drizzle pattern: use onConflictDoNothing
    const inserted = await db
      .insert(customerCoupons)
      .values(rows)
      .onConflictDoNothing({
        target: [customerCoupons.customerId, customerCoupons.couponId],
      })
      .returning({ customerId: customerCoupons.customerId })

    issuedCount += inserted.length
    for (const r of inserted) {
      issuedPairs.push({ couponId: coupon.id, customerId: r.customerId })
    }
  }

  if (issuedPairs.length > 0) {
    await sendNotifications(issuedPairs).catch((err) => {
      console.error('[issueAutoCoupons] notification failed:', err)
    })
  }

  return {
    issuedCount,
    couponCodes: matching.map((c) => c.code),
  }
}

async function sendNotifications(pairs: Array<{ couponId: string; customerId: string }>) {
  const couponIds = Array.from(new Set(pairs.map((p) => p.couponId)))
  const customerIds = Array.from(new Set(pairs.map((p) => p.customerId)))

  const couponRows = await db
    .select()
    .from(coupons)
    .where(inArray(coupons.id, couponIds))
  const customerRows = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      lineUserId: customers.lineUserId,
      notificationPrefs: customers.notificationPrefs,
    })
    .from(customers)
    .where(inArray(customers.id, customerIds))

  const couponById = new Map(couponRows.map((c) => [c.id, c]))
  const customerById = new Map(customerRows.map((c) => [c.id, c]))
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ccbabylife.com'

  for (const { couponId, customerId } of pairs) {
    const coupon = couponById.get(couponId)
    const cust = customerById.get(customerId)
    if (!coupon || !cust) continue

    const desc = describeCoupon(coupon)
    const expiresLine = coupon.expiresAt
      ? `\n有效期限：${new Date(coupon.expiresAt).toLocaleDateString('zh-Hant')}`
      : ''
    const body = `你收到一張新優惠券 🎁\n\n代碼：${coupon.code}\n優惠：${desc}${expiresLine}\n\n👉 一鍵套用：\n${siteUrl}/coupon/redeem?code=${encodeURIComponent(coupon.code)}\n\n查看全部：${siteUrl}/account/coupons`
    const prefs = cust.notificationPrefs ?? { line: true, email: true }

    if (prefs.line && cust.lineUserId) {
      await queueAndSendLine({
        customerId,
        templateId: `coupon.auto.${coupon.autoIssueOn}`,
        body,
        payload: { couponId, code: coupon.code },
      }).catch(() => {})
    }
    if (prefs.email) {
      await enqueuePush({
        customerId,
        channel: 'email',
        templateId: `coupon.auto.${coupon.autoIssueOn}`,
        subject: `你收到一張新優惠券：${coupon.code}`,
        body,
        payload: { couponId, code: coupon.code },
      }).catch(() => {})
    }
  }
}

function describeCoupon(c: typeof coupons.$inferSelect): string {
  if (c.type === 'free_shipping') return '免運優惠'
  if (c.type === 'percent') return `${c.value}% 折扣`
  if (c.type === 'tiered') return `滿 ${formatTwd(c.minOrderTwd)} 折 ${formatTwd(c.value)}`
  return `折抵 ${formatTwd(c.value)}`
}

/**
 * Match customers whose babyBirthDate's month-day = today (Asia/Taipei).
 * Returns customer IDs.
 */
export async function findBirthdayCustomersToday(): Promise<string[]> {
  // Use Postgres date_part on baby_birth_date in Taipei timezone
  const rows = await db
    .select({ id: customers.id })
    .from(customers)
    .where(
      and(
        eq(customers.orgId, DEFAULT_ORG_ID),
        eq(customers.isBlacklisted, false),
        sql`extract(month from ${customers.babyBirthDate}) = extract(month from (now() at time zone 'Asia/Taipei')::date)`,
        sql`extract(day from ${customers.babyBirthDate}) = extract(day from (now() at time zone 'Asia/Taipei')::date)`
      )
    )
  return rows.map((r) => r.id)
}
