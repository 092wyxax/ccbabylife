'use client'

import { useTransition } from 'react'
import { dismissActiveCouponAction } from '@/server/actions/active-coupon'

export function CouponBannerDismiss() {
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => dismissActiveCouponAction())}
      className="font-jp text-[10px] sm:text-xs tracking-widest opacity-80 hover:opacity-100 disabled:opacity-50 underline-offset-2 hover:underline"
      aria-label="移除優惠券"
    >
      ✕
    </button>
  )
}
