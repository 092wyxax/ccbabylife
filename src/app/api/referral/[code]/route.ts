import { NextRequest, NextResponse } from 'next/server'
import { findCustomerByReferralCode } from '@/server/services/ReferralService'
import { REFERRAL_COOKIE } from '@/lib/referral'

const COOKIE_DAYS = 30

interface Props {
  params: Promise<{ code: string }>
}

/**
 * Referral landing: /api/referral/<CODE> sets a cookie and redirects to home.
 * Use as: https://your-domain.com/api/referral/ABC12345
 */
export async function GET(_request: NextRequest, { params }: Props) {
  const { code } = await params
  const upper = code.toUpperCase()

  const found = await findCustomerByReferralCode(upper)
  // Even if invalid, redirect home — don't expose validity (timing leak prevention).

  const response = NextResponse.redirect(
    new URL('/?ref=' + (found ? '1' : '0'), process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')
  )
  if (found) {
    response.cookies.set(REFERRAL_COOKIE, upper, {
      httpOnly: false,
      maxAge: COOKIE_DAYS * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
    })
  }
  return response
}
