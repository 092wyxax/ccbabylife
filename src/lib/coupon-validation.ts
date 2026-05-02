import type { Coupon } from '@/db/schema/coupons'

export interface CouponValidation {
  ok: boolean
  reason?: string
  discountAmount?: number
}

export function validateCoupon(
  coupon: Coupon,
  subtotalTwd: number
): CouponValidation {
  if (!coupon.isActive) return { ok: false, reason: '此優惠碼已停用' }
  if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
    return { ok: false, reason: '此優惠碼已過期' }
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, reason: '此優惠碼已達使用上限' }
  }
  if (subtotalTwd < coupon.minOrderTwd) {
    return {
      ok: false,
      reason: `訂單滿 NT$${coupon.minOrderTwd} 才能使用此優惠碼`,
    }
  }
  const discount =
    coupon.type === 'fixed'
      ? coupon.value
      : Math.floor((subtotalTwd * coupon.value) / 100)
  return { ok: true, discountAmount: Math.min(discount, subtotalTwd) }
}
