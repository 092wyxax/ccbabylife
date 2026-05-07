import 'server-only'
import { cookies } from 'next/headers'

export const ACTIVE_COUPON_COOKIE = 'pending_coupon'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

export async function getActiveCouponCode(): Promise<string | null> {
  const store = await cookies()
  const v = store.get(ACTIVE_COUPON_COOKIE)?.value
  return v ? v.toUpperCase() : null
}

export async function setActiveCouponCookie(code: string): Promise<void> {
  const store = await cookies()
  store.set(ACTIVE_COUPON_COOKIE, code.toUpperCase(), {
    maxAge: MAX_AGE_SECONDS,
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
}

export async function clearActiveCouponCookie(): Promise<void> {
  const store = await cookies()
  store.delete(ACTIVE_COUPON_COOKIE)
}
