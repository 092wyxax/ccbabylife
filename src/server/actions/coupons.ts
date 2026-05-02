'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/server/services/AdminAuthService'
import {
  createCoupon,
  findActiveCouponByCode,
  toggleCouponActive,
  validateCoupon,
} from '@/server/services/CouponService'
import { couponTypeEnum } from '@/db/schema/coupons'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export type CouponActionState = { error?: string; success?: string }

const createSchema = z.object({
  code: z.string().min(2, '代碼至少 2 字'),
  type: z.enum(couponTypeEnum),
  value: z.coerce.number().int().positive(),
  minOrderTwd: z.coerce.number().int().nonnegative().default(0),
  maxUses: z.coerce.number().int().positive().optional(),
  expiresAt: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export async function createCouponAction(
  _prev: CouponActionState,
  formData: FormData
): Promise<CouponActionState> {
  await requireAdmin()
  const parsed = createSchema.safeParse({
    code: formData.get('code'),
    type: formData.get('type'),
    value: formData.get('value'),
    minOrderTwd: formData.get('minOrderTwd') || 0,
    maxUses: formData.get('maxUses') || undefined,
    expiresAt: formData.get('expiresAt') ?? '',
    notes: formData.get('notes') ?? '',
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  }

  if (parsed.data.type === 'percent' && parsed.data.value > 100) {
    return { error: '百分比折扣不能超過 100' }
  }

  await createCoupon({
    code: parsed.data.code,
    type: parsed.data.type,
    value: parsed.data.value,
    minOrderTwd: parsed.data.minOrderTwd,
    maxUses: parsed.data.maxUses ?? null,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    notes: parsed.data.notes || null,
  })

  revalidatePath('/admin/marketing/coupons')
  return { success: '已新增優惠碼' }
}

export async function toggleCouponActiveFormAction(formData: FormData): Promise<void> {
  await requireAdmin()
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
  return { discount: result.discountAmount, code: coupon.code }
}
