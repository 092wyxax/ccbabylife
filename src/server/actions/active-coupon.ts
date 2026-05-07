'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { clearActiveCouponCookie, setActiveCouponCookie } from '@/lib/active-coupon'
import { findActiveCouponByCode, validateCoupon } from '@/server/services/CouponService'

export async function dismissActiveCouponAction() {
  await clearActiveCouponCookie()
  revalidatePath('/', 'layout')
}

export type ApplyCouponState = {
  error?: string
  ok?: boolean
  code?: string
  discount?: number
  freeShipping?: boolean
}

const applySchema = z.object({
  code: z.string().min(1).max(40),
  subtotalTwd: z.coerce.number().int().nonnegative(),
})

export async function applyCouponAction(
  _prev: ApplyCouponState,
  formData: FormData
): Promise<ApplyCouponState> {
  const parsed = applySchema.safeParse({
    code: formData.get('code'),
    subtotalTwd: formData.get('subtotalTwd'),
  })
  if (!parsed.success) return { error: '請輸入優惠碼' }

  const coupon = await findActiveCouponByCode(parsed.data.code)
  if (!coupon) return { error: '查無此優惠碼' }

  const result = validateCoupon(coupon, parsed.data.subtotalTwd)
  if (!result.ok) return { error: result.reason }

  await setActiveCouponCookie(coupon.code)
  return {
    ok: true,
    code: coupon.code,
    discount: result.discountAmount,
    freeShipping: result.freeShipping,
  }
}
