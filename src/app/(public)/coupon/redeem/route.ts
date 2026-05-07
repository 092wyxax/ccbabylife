import { NextRequest, NextResponse } from 'next/server'
import { findActiveCouponByCode } from '@/server/services/CouponService'
import { setActiveCouponCookie } from '@/lib/active-coupon'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim().toUpperCase() ?? ''
  const next = req.nextUrl.searchParams.get('next') || '/shop'

  if (!code) {
    return NextResponse.redirect(new URL('/?coupon-error=missing', req.url))
  }

  const coupon = await findActiveCouponByCode(code)
  if (!coupon) {
    return NextResponse.redirect(new URL(`/?coupon-error=notfound`, req.url))
  }
  if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
    return NextResponse.redirect(new URL(`/?coupon-error=expired`, req.url))
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.redirect(new URL(`/?coupon-error=used-up`, req.url))
  }

  await setActiveCouponCookie(code)

  const target = next.startsWith('/') ? next : '/shop'
  return NextResponse.redirect(new URL(`${target}?coupon-applied=${code}`, req.url))
}
