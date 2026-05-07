import { NextRequest, NextResponse } from 'next/server'
import {
  findBirthdayCustomersToday,
  issueAutoCoupons,
} from '@/server/services/AutoCouponService'

/**
 * Daily cron: finds customers whose babyBirthDate matches today (Asia/Taipei)
 * and issues coupons with autoIssueOn='birthday'. Idempotent via the unique
 * constraint on (customer_id, coupon_id) — running twice in the same day
 * does not double-issue.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    auth !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const customerIds = await findBirthdayCustomersToday()
  if (customerIds.length === 0) {
    return NextResponse.json({ ok: true, matched: 0, issued: 0 })
  }

  const result = await issueAutoCoupons('birthday', customerIds)

  return NextResponse.json({
    ok: true,
    matched: customerIds.length,
    issued: result.issuedCount,
    couponCodes: result.couponCodes,
  })
}
