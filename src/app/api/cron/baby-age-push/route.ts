import { NextRequest, NextResponse } from 'next/server'
import { and, eq, isNotNull } from 'drizzle-orm'
import { db } from '@/db/client'
import { customers, pushLogs, type Customer } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { listProductsByAge } from '@/server/services/ProductService'
import { renderTemplate, LINE_TEMPLATES } from '@/lib/line-templates'
import {
  findBirthdayCustomersToday,
  issueAutoCoupons,
} from '@/server/services/AutoCouponService'
import { dispatchCartRecoveryPushes } from '@/server/services/CartRecovery'

/**
 * Vercel Cron entry: runs daily and finds customers whose baby crosses
 * a month-anniversary today. Renders the L5 monthly template + queues
 * a push_logs row per customer (status='queued'). Real LINE / Email
 * delivery happens later when those integrations are wired.
 *
 * Vercel Cron config in vercel.json: { "crons": [{ "path":
 * "/api/cron/baby-age-push", "schedule": "0 0 * * *" }] }
 *
 * Secured by CRON_SECRET (Vercel injects via Authorization header).
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    auth !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const now = new Date()
  const todayDay = now.getUTCDate() // 1..31

  // Find customers with babyBirthDate where day-of-month matches today,
  // AND notification prefs allow LINE/Email.
  const candidates = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.orgId, DEFAULT_ORG_ID),
        isNotNull(customers.babyBirthDate)
      )
    )

  const due = candidates.filter((c) => {
    if (!c.babyBirthDate) return false
    if (c.isBlacklisted) return false
    const born = new Date(c.babyBirthDate)
    if (born.getUTCDate() !== todayDay) return false
    // Calculate age in months
    const ageMonths =
      (now.getUTCFullYear() - born.getUTCFullYear()) * 12 +
      (now.getUTCMonth() - born.getUTCMonth())
    return ageMonths > 0 && ageMonths <= 60
  })

  const tmpl = LINE_TEMPLATES.find((t) => t.id === 'L5-monthly')!

  let queued = 0
  for (const c of due) {
    const ageMonths = babyAgeMonthsExact(c)
    const buckets = await listProductsByAge(ageMonths)
    if (buckets.fits.length === 0) continue

    const top3 = buckets.fits.slice(0, 3)
    const vars: Record<string, string> = {
      customer_name: c.name ?? '妳',
      baby_age_months: String(ageMonths),
      product_1_name: top3[0]?.product.nameZh ?? '—',
      price_1: String(top3[0]?.product.priceTwd ?? 0),
      product_2_name: top3[1]?.product.nameZh ?? '—',
      price_2: String(top3[1]?.product.priceTwd ?? 0),
      product_3_name: top3[2]?.product.nameZh ?? '—',
      price_3: String(top3[2]?.product.priceTwd ?? 0),
      recommend_url: `${process.env.NEXT_PUBLIC_SITE_URL}/shop`,
    }

    const body = renderTemplate(tmpl.body, vars)

    const channels: Array<'line' | 'email'> = []
    if (c.notificationPrefs?.line && c.lineUserId) channels.push('line')
    if (c.notificationPrefs?.email) channels.push('email')

    for (const channel of channels) {
      await db.insert(pushLogs).values({
        orgId: DEFAULT_ORG_ID,
        customerId: c.id,
        channel,
        status: 'queued',
        templateId: tmpl.id,
        subject: channel === 'email' ? `${ageMonths} 個月寶寶選物推薦` : null,
        body,
        payload: { ageMonths, top3: top3.map((t) => t.product.slug) },
      })
      queued++
    }
  }

  // Birthday coupon issuance (piggybacks on this daily cron)
  let birthdayMatched = 0
  let birthdayIssued = 0
  try {
    const birthdayIds = await findBirthdayCustomersToday()
    birthdayMatched = birthdayIds.length
    if (birthdayIds.length > 0) {
      const r = await issueAutoCoupons('birthday', birthdayIds)
      birthdayIssued = r.issuedCount
    }
  } catch (e) {
    console.error('[baby-age-push] birthday coupon issuance failed:', e)
  }

  // Cart abandonment recovery (carts > 4 hr old, not yet pushed)
  let recoveryMatched = 0
  let recoveryPushed = 0
  try {
    const r = await dispatchCartRecoveryPushes()
    recoveryMatched = r.matched
    recoveryPushed = r.pushed
  } catch (e) {
    console.error('[baby-age-push] cart recovery failed:', e)
  }

  return NextResponse.json({
    processedCustomers: due.length,
    queuedPushes: queued,
    birthdayMatched,
    birthdayIssued,
    recoveryMatched,
    recoveryPushed,
    timestamp: now.toISOString(),
  })
}

function babyAgeMonthsExact(c: Customer): number {
  if (!c.babyBirthDate) return 0
  const born = new Date(c.babyBirthDate)
  const now = new Date()
  return (
    (now.getUTCFullYear() - born.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - born.getUTCMonth())
  )
}
