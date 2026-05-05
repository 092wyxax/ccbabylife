'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { and, eq, inArray, isNull } from 'drizzle-orm'
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
  notFound?: string[]
}

const grantSchema = z.object({
  emails: z.string().min(1, '請輸入至少一個 Email'),
})

export async function grantCouponAction(
  couponId: string,
  _prev: GrantCouponState,
  formData: FormData
): Promise<GrantCouponState> {
  await requireRole(['owner', 'manager', 'editor'])

  const parsed = grantSchema.safeParse({ emails: formData.get('emails') })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  }

  const inputEmails = parsed.data.emails
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  if (inputEmails.length === 0) {
    return { error: '請輸入 Email' }
  }
  if (inputEmails.length > 200) {
    return { error: '單次最多 200 筆' }
  }

  const matches = await db
    .select({ id: customers.id, email: customers.email })
    .from(customers)
    .where(
      and(
        eq(customers.orgId, DEFAULT_ORG_ID),
        inArray(customers.email, inputEmails)
      )
    )

  const matchedEmails = new Set(matches.map((m) => m.email.toLowerCase()))
  const notFound = inputEmails.filter((e) => !matchedEmails.has(e))

  // Find existing grants to skip
  const existing = await db
    .select({ customerId: customerCoupons.customerId })
    .from(customerCoupons)
    .where(
      and(
        eq(customerCoupons.couponId, couponId),
        inArray(customerCoupons.customerId, matches.map((m) => m.id))
      )
    )
  const existingIds = new Set(existing.map((e) => e.customerId))

  const toInsert = matches.filter((m) => !existingIds.has(m.id))
  if (toInsert.length > 0) {
    await db.insert(customerCoupons).values(
      toInsert.map((m) => ({
        orgId: DEFAULT_ORG_ID,
        customerId: m.id,
        couponId,
      }))
    )
  }

  revalidatePath(`/admin/marketing/coupons/${couponId}`)

  return {
    granted: toInsert.length,
    alreadyHad: existingIds.size,
    notFound,
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
