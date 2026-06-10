import { NextRequest } from 'next/server'
import { findActiveCouponByCode } from '@/server/services/CouponService'
import { setActiveCouponCookie } from '@/lib/active-coupon'
import { redirectToPath } from '@/lib/http-redirect'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim().toUpperCase() ?? ''
  const next = req.nextUrl.searchParams.get('next') || '/shop'

  if (!code) {
    return redirectToPath('/?coupon-error=missing')
  }

  const coupon = await findActiveCouponByCode(code)
  if (!coupon) {
    return redirectToPath(`/?coupon-error=notfound`)
  }
  if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
    return redirectToPath(`/?coupon-error=expired`)
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return redirectToPath(`/?coupon-error=used-up`)
  }

  await setActiveCouponCookie(code)

  const target = next.startsWith('/') ? next : '/shop'
  return redirectToPath(`${target}?coupon-applied=${code}`)
}
