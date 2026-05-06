'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { and, eq, ilike, inArray, isNull } from 'drizzle-orm'
import { db } from '@/db/client'
import { requireRole } from '@/server/services/AdminAuthService'
import {
  createCoupon,
  updateCoupon,
  deleteCoupon,
  findActiveCouponByCode,
  toggleCouponActive,
  validateCoupon,
  type CouponInput,
} from '@/server/services/CouponService'
import { couponTypeEnum, couponAutoIssueEnum } from '@/db/schema/coupons'
import { customerCoupons } from '@/db/schema/customer_coupons'
import { customers } from '@/db/schema/customers'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { enqueuePush, queueAndSendLine } from '@/server/services/NotificationService'
import { getCouponById } from '@/server/services/CouponService'
import { formatTwd } from '@/lib/format'

export type CouponActionState = { error?: string; success?: string }

const baseSchema = z.object({
  code: z.string().min(2, '代碼至少 2 字').max(40),
  type: z.enum(couponTypeEnum),
  value: z.coerce.number().int().nonnegative(),
  description: z.string().max(200).optional(),
  minOrderTwd: z.coerce.number().int().nonnegative().default(0),
  maxUses: z.coerce.number().int().positive().optional().nullable(),
  perUserLimit: z.coerce.number().int().positive().optional().nullable(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  applicableProductIds: z.array(z.string().uuid()).optional(),
  applicableCategorySlugs: z.array(z.string()).optional(),
  autoIssueOn: z.enum(couponAutoIssueEnum).default('manual'),
  isActive: z.coerce.boolean().optional(),
  notes: z.string().max(1000).optional(),
})

function parseForm(formData: FormData) {
  return baseSchema.safeParse({
    code: formData.get('code'),
    type: formData.get('type'),
    value: formData.get('value') || 0,
    description: formData.get('description') || undefined,
    minOrderTwd: formData.get('minOrderTwd') || 0,
    maxUses: formData.get('maxUses') || null,
    perUserLimit: formData.get('perUserLimit') || null,
    startsAt: (formData.get('startsAt') as string) || undefined,
    expiresAt: (formData.get('expiresAt') as string) || undefined,
    applicableProductIds: formData.getAll('applicableProductIds').map(String).filter(Boolean),
    applicableCategorySlugs: formData.getAll('applicableCategorySlugs').map(String).filter(Boolean),
    autoIssueOn: formData.get('autoIssueOn') || 'manual',
    isActive: formData.get('isActive') === 'on',
    notes: formData.get('notes') || undefined,
  })
}

function inputFromParsed(data: z.infer<typeof baseSchema>): CouponInput {
  return {
    code: data.code,
    type: data.type,
    value: data.value,
    description: data.description?.trim() || null,
    minOrderTwd: data.minOrderTwd,
    maxUses: data.maxUses ?? null,
    perUserLimit: data.perUserLimit ?? null,
    startsAt: data.startsAt ? new Date(data.startsAt) : null,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    applicableProductIds: data.applicableProductIds ?? [],
    applicableCategorySlugs: data.applicableCategorySlugs ?? [],
    autoIssueOn: data.autoIssueOn,
    isActive: data.isActive ?? true,
    notes: data.notes?.trim() || null,
  }
}

function validateBusinessRules(
  data: z.infer<typeof baseSchema>
): string | null {
  if (data.type === 'percent') {
    if (data.value < 1 || data.value > 100) return '百分比折扣需介於 1–100'
  }
  if (data.type === 'fixed' || data.type === 'tiered') {
    if (data.value < 1) return '折抵金額需大於 0'
  }
  if (data.type === 'tiered' && data.minOrderTwd <= 0) {
    return '滿額折扣需設定最低訂單金額'
  }
  return null
}

export async function createCouponAction(
  _prev: CouponActionState,
  formData: FormData
): Promise<CouponActionState> {
  await requireRole(['owner', 'manager', 'editor'])

  const parsed = parseForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  }
  const ruleErr = validateBusinessRules(parsed.data)
  if (ruleErr) return { error: ruleErr }

  await createCoupon(inputFromParsed(parsed.data))

  revalidatePath('/admin/marketing/coupons')
  redirect('/admin/marketing/coupons')
}

export async function updateCouponAction(
  id: string,
  _prev: CouponActionState,
  formData: FormData
): Promise<CouponActionState> {
  await requireRole(['owner', 'manager', 'editor'])

  const parsed = parseForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  }
  const ruleErr = validateBusinessRules(parsed.data)
  if (ruleErr) return { error: ruleErr }

  await updateCoupon(id, inputFromParsed(parsed.data))

  revalidatePath('/admin/marketing/coupons')
  revalidatePath(`/admin/marketing/coupons/${id}`)
  redirect('/admin/marketing/coupons')
}

export async function deleteCouponAction(id: string) {
  await requireRole(['owner', 'manager'])
  await deleteCoupon(id)
  revalidatePath('/admin/marketing/coupons')
  redirect('/admin/marketing/coupons')
}

export async function toggleCouponActiveFormAction(formData: FormData): Promise<void> {
  await requireRole(['owner', 'manager', 'editor'])
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await toggleCouponActive(id)
  revalidatePath('/admin/marketing/coupons')
}

const checkSchema = z.object({
  code: z.string().min(1),
  subtotalTwd: z.coerce.number().int().nonnegative(),
})

export type CouponCheckState = {
  error?: string
  discount?: number
  code?: string
  freeShipping?: boolean
}

export type GrantCouponState = {
  error?: string
  granted?: number
  alreadyHad?: number
}

export interface CustomerSearchResult {
  id: string
  name: string | null
  email: string
}

export async function searchCustomersForGrantAction(
  query: string
): Promise<CustomerSearchResult[]> {
  await requireRole(['owner', 'manager', 'editor'])

  const q = query.trim().toLowerCase()
  if (q.length < 1) return []

  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
    })
    .from(customers)
    .where(
      and(
        eq(customers.orgId, DEFAULT_ORG_ID),
        ilike(customers.email, `%${q}%`)
      )
    )
    .limit(20)

  // Also search by name and merge
  const byName = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
    })
    .from(customers)
    .where(
      and(
        eq(customers.orgId, DEFAULT_ORG_ID),
        ilike(customers.name, `%${q}%`)
      )
    )
    .limit(20)

  const seen = new Set<string>()
  const merged: CustomerSearchResult[] = []
  for (const r of [...rows, ...byName]) {
    if (seen.has(r.id)) continue
    seen.add(r.id)
    merged.push(r)
    if (merged.length >= 20) break
  }
  return merged
}

const grantIdsSchema = z.object({
  customerIds: z.array(z.string().uuid()).min(1, '請至少選一位會員'),
})

export async function grantCouponAction(
  couponId: string,
  _prev: GrantCouponState,
  formData: FormData
): Promise<GrantCouponState> {
  await requireRole(['owner', 'manager', 'editor'])

  const ids = formData.getAll('customerIds').map(String).filter(Boolean)
  const parsed = grantIdsSchema.safeParse({ customerIds: ids })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '請至少選一位會員' }
  }
  if (parsed.data.customerIds.length > 200) {
    return { error: '單次最多 200 位' }
  }

  // Verify the customers belong to this org
  const verified = await db
    .select({ id: customers.id })
    .from(customers)
    .where(
      and(
        eq(customers.orgId, DEFAULT_ORG_ID),
        inArray(customers.id, parsed.data.customerIds)
      )
    )
  const verifiedIds = verified.map((v) => v.id)

  // Skip already-granted
  const existing = await db
    .select({ customerId: customerCoupons.customerId })
    .from(customerCoupons)
    .where(
      and(
        eq(customerCoupons.couponId, couponId),
        inArray(customerCoupons.customerId, verifiedIds)
      )
    )
  const existingSet = new Set(existing.map((e) => e.customerId))

  const toInsert = verifiedIds.filter((id) => !existingSet.has(id))
  if (toInsert.length > 0) {
    await db.insert(customerCoupons).values(
      toInsert.map((id) => ({
        orgId: DEFAULT_ORG_ID,
        customerId: id,
        couponId,
      }))
    )

    await notifyCouponGranted(couponId, toInsert).catch((err) => {
      console.error('[grantCouponAction] notification queue failed:', err)
    })
  }

  revalidatePath(`/admin/marketing/coupons/${couponId}`)
  return {
    granted: toInsert.length,
    alreadyHad: existingSet.size,
  }
}

function describeCouponInline(c: NonNullable<Awaited<ReturnType<typeof getCouponById>>>): string {
  if (c.type === 'free_shipping') return '免運優惠'
  if (c.type === 'percent') return `${c.value}% 折扣`
  if (c.type === 'tiered') return `滿 ${formatTwd(c.minOrderTwd)} 折 ${formatTwd(c.value)}`
  return `折抵 ${formatTwd(c.value)}`
}

async function notifyCouponGranted(couponId: string, customerIds: string[]) {
  const coupon = await getCouponById(couponId)
  if (!coupon) return

  const recipients = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      lineUserId: customers.lineUserId,
      notificationPrefs: customers.notificationPrefs,
    })
    .from(customers)
    .where(
      and(
        eq(customers.orgId, DEFAULT_ORG_ID),
        inArray(customers.id, customerIds)
      )
    )

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ccbabylife.com'
  const desc = describeCouponInline(coupon)
  const expiresLine = coupon.expiresAt
    ? `\n有效期限：${new Date(coupon.expiresAt).toLocaleDateString('zh-Hant')}`
    : ''

  for (const r of recipients) {
    const body = `你收到一張新優惠券 🎁\n\n代碼：${coupon.code}\n優惠：${desc}${expiresLine}\n\n到會員中心查看：${siteUrl}/account/coupons`
    const prefs = r.notificationPrefs ?? { line: true, email: true }

    if (prefs.line && r.lineUserId) {
      await queueAndSendLine({
        customerId: r.id,
        templateId: 'coupon.granted',
        body,
        payload: { couponId, code: coupon.code },
      }).catch(() => {})
    }
    if (prefs.email) {
      await enqueuePush({
        customerId: r.id,
        channel: 'email',
        templateId: 'coupon.granted',
        subject: `你收到一張新優惠券：${coupon.code}`,
        body,
        payload: { couponId, code: coupon.code },
      }).catch(() => {})
    }
  }
}

export async function revokeCouponGrantAction(
  customerCouponId: string,
  couponId: string
) {
  await requireRole(['owner', 'manager', 'editor'])

  // Only revoke if not yet used
  await db
    .delete(customerCoupons)
    .where(
      and(
        eq(customerCoupons.id, customerCouponId),
        isNull(customerCoupons.usedAt)
      )
    )

  revalidatePath(`/admin/marketing/coupons/${couponId}`)
}

export async function checkCouponAction(
  _prev: CouponCheckState,
  formData: FormData
): Promise<CouponCheckState> {
  const ip = await getClientIp()
  const limit = rateLimit(`coupon-check:${ip}`, 20, 60 * 60 * 1000)
  if (!limit.ok) {
    return { error: '查詢太頻繁，請稍後再試' }
  }

  const parsed = checkSchema.safeParse({
    code: formData.get('code'),
    subtotalTwd: formData.get('subtotalTwd'),
  })
  if (!parsed.success) return { error: '請輸入優惠碼' }

  const coupon = await findActiveCouponByCode(parsed.data.code)
  if (!coupon) return { error: '查無此優惠碼' }

  const result = validateCoupon(coupon, parsed.data.subtotalTwd)
  if (!result.ok) return { error: result.reason }
  return {
    discount: result.discountAmount,
    code: coupon.code,
    freeShipping: result.freeShipping,
  }
}
