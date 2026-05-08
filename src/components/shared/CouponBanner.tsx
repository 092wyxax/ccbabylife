import { Gift } from 'lucide-react'
import { getActiveCouponCode } from '@/lib/active-coupon'
import { findActiveCouponByCode } from '@/server/services/CouponService'
import { formatTwd } from '@/lib/format'
import { CouponBannerDismiss } from './CouponBannerDismiss'

export async function CouponBanner() {
  const code = await getActiveCouponCode()
  if (!code) return null

  const coupon = await findActiveCouponByCode(code)
  if (!coupon) return null
  if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) return null

  const desc =
    coupon.type === 'free_shipping'
      ? '免運優惠'
      : coupon.type === 'percent'
        ? `${coupon.value}% 折扣`
        : coupon.type === 'tiered'
          ? `滿 ${formatTwd(coupon.minOrderTwd)} 折 ${formatTwd(coupon.value)}`
          : `折抵 ${formatTwd(coupon.value)}`

  return (
    <div className="bg-blush text-ink text-xs sm:text-sm border-b border-blush">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-2 flex items-center justify-between gap-3">
        <span className="truncate flex items-center gap-2">
          <Gift size={14} strokeWidth={1.5} aria-hidden />
          優惠券 <strong className="font-mono mx-1">{coupon.code}</strong>
          已套用 · {desc} · 結帳時自動折抵
        </span>
        <CouponBannerDismiss />
      </div>
    </div>
  )
}
