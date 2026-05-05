import type { Coupon } from '@/db/schema/coupons'

export interface CouponValidation {
  ok: boolean
  reason?: string
  /** Discount applied to the order subtotal (NTD). */
  discountAmount?: number
  /** True when the coupon waives shipping cost. */
  freeShipping?: boolean
}

export interface CartLineForCoupon {
  productId: string
  categorySlug?: string | null
  /** Per-line subtotal in TWD (price × quantity). */
  amountTwd: number
}

interface ValidateOptions {
  customerUseCount?: number
  cartLines?: CartLineForCoupon[]
}

export function validateCoupon(
  coupon: Coupon,
  subtotalTwd: number,
  options: ValidateOptions = {}
): CouponValidation {
  if (!coupon.isActive) return { ok: false, reason: '此優惠碼已停用' }

  const now = new Date()
  if (coupon.startsAt && now < new Date(coupon.startsAt)) {
    return { ok: false, reason: '此優惠碼尚未開始' }
  }
  if (coupon.expiresAt && now > new Date(coupon.expiresAt)) {
    return { ok: false, reason: '此優惠碼已過期' }
  }

  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, reason: '此優惠碼已達使用上限' }
  }

  if (
    coupon.perUserLimit != null &&
    options.customerUseCount != null &&
    options.customerUseCount >= coupon.perUserLimit
  ) {
    return { ok: false, reason: '你已達此優惠碼的個人使用上限' }
  }

  const restrictsProducts =
    coupon.applicableProductIds && coupon.applicableProductIds.length > 0
  const restrictsCategories =
    coupon.applicableCategorySlugs && coupon.applicableCategorySlugs.length > 0

  let applicableSubtotal = subtotalTwd
  if ((restrictsProducts || restrictsCategories) && options.cartLines) {
    applicableSubtotal = options.cartLines
      .filter((line) => {
        const productOk =
          !restrictsProducts ||
          coupon.applicableProductIds!.includes(line.productId)
        const categoryOk =
          !restrictsCategories ||
          (line.categorySlug != null &&
            coupon.applicableCategorySlugs!.includes(line.categorySlug))
        if (restrictsProducts && restrictsCategories) return productOk || categoryOk
        if (restrictsProducts) return productOk
        return categoryOk
      })
      .reduce((sum, l) => sum + l.amountTwd, 0)

    if (applicableSubtotal === 0) {
      return { ok: false, reason: '此優惠碼不適用於購物車內任何商品' }
    }
  }

  if (subtotalTwd < coupon.minOrderTwd) {
    return {
      ok: false,
      reason: `訂單滿 NT$${coupon.minOrderTwd.toLocaleString()} 才能使用此優惠碼`,
    }
  }

  switch (coupon.type) {
    case 'free_shipping':
      return { ok: true, discountAmount: 0, freeShipping: true }
    case 'fixed':
    case 'tiered': {
      const discount = Math.min(coupon.value, applicableSubtotal)
      return { ok: true, discountAmount: discount }
    }
    case 'percent': {
      const discount = Math.floor((applicableSubtotal * coupon.value) / 100)
      return { ok: true, discountAmount: Math.min(discount, applicableSubtotal) }
    }
  }
}
