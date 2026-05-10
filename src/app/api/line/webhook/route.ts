import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { and, eq, gt, isNull, lte, or } from 'drizzle-orm'
import { db } from '@/db/client'
import { lineMessages } from '@/db/schema/line_messages'
import { coupons } from '@/db/schema/coupons'
import { customers } from '@/db/schema/customers'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { pushText, isLineConfigured } from '@/lib/line-messaging'
import { LINE_TEMPLATES, renderTemplate } from '@/lib/line-templates'
import { issueAutoCoupons } from '@/server/services/AutoCouponService'

/**
 * LINE Messaging API webhook receiver.
 *
 * Configure in LINE Developers Console:
 *   Webhook URL: https://ccbabylife.com/api/line/webhook
 *   Use webhook: ON
 *
 * Validates X-Line-Signature against LINE_MESSAGING_CHANNEL_SECRET.
 *
 * Handled events:
 *   - message (text): stored in line_messages for the admin inbox
 *   - follow: send L1-welcome message + first-order coupon code (Tier 1 #5)
 */
export async function POST(req: NextRequest) {
  const secret = process.env.LINE_MESSAGING_CHANNEL_SECRET
  if (!secret) {
    return new NextResponse('LINE_MESSAGING_CHANNEL_SECRET not set', { status: 500 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('x-line-signature') ?? ''

  // HMAC-SHA256 verification
  const computed = createHmac('sha256', secret).update(rawBody).digest('base64')
  try {
    const a = Buffer.from(signature)
    const b = Buffer.from(computed)
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return new NextResponse('Invalid signature', { status: 401 })
    }
  } catch {
    return new NextResponse('Invalid signature', { status: 401 })
  }

  let payload: { events?: Array<Record<string, unknown>> }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new NextResponse('Bad JSON', { status: 400 })
  }

  const events = payload.events ?? []
  for (const e of events) {
    try {
      await handleEvent(e)
    } catch (err) {
      console.error('[line/webhook] event failed:', err)
    }
  }

  return NextResponse.json({ ok: true })
}

interface LineEvent {
  type?: string
  message?: { id?: string; type?: string; text?: string }
  source?: { userId?: string; type?: string }
  timestamp?: number
}

async function handleEvent(e: Record<string, unknown>): Promise<void> {
  const ev = e as LineEvent

  if (ev.type === 'follow') {
    await handleFollow(ev)
    return
  }

  if (ev.type !== 'message') return
  if (ev.message?.type !== 'text') return // skip stickers/images for now
  const lineUserId = ev.source?.userId
  const text = ev.message?.text
  const messageId = ev.message?.id
  if (!lineUserId || !text) return

  await db
    .insert(lineMessages)
    .values({
      orgId: DEFAULT_ORG_ID,
      lineUserId,
      direction: 'in',
      lineMessageId: messageId ?? null,
      type: 'text',
      text,
      raw: ev as unknown as Record<string, unknown>,
      isRead: false,
    })
    .onConflictDoNothing({ target: lineMessages.lineMessageId })
}

/**
 * On follow: send the L1-welcome message and (if a 'line_follow' auto-issue
 * coupon is configured) include its code so the user can apply it on first
 * order. If a customer record already exists with this lineUserId, also
 * grant the coupon to that customer record via issueAutoCoupons.
 */
async function handleFollow(ev: LineEvent): Promise<void> {
  const lineUserId = ev.source?.userId
  if (!lineUserId) return
  if (!isLineConfigured()) return

  // Find an active line_follow coupon (if any)
  const now = new Date()
  const [coupon] = await db
    .select()
    .from(coupons)
    .where(
      and(
        eq(coupons.orgId, DEFAULT_ORG_ID),
        eq(coupons.autoIssueOn, 'line_follow'),
        eq(coupons.isActive, true),
        or(isNull(coupons.expiresAt), gt(coupons.expiresAt, now)),
        or(isNull(coupons.startsAt), lte(coupons.startsAt, now))
      )
    )
    .limit(1)

  // If customer already linked, grant via the structured path
  if (coupon) {
    const [existingCustomer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.lineUserId, lineUserId))
      .limit(1)
    if (existingCustomer) {
      await issueAutoCoupons('line_follow', [existingCustomer.id]).catch((err) => {
        console.error('[line/webhook] issueAutoCoupons failed:', err)
      })
    }
  }

  // Always send the welcome message (the issueAutoCoupons path may have
  // already sent its own LINE; keeping this guarantees a hello even if
  // the user is brand new).
  const welcomeTpl = LINE_TEMPLATES.find((t) => t.id === 'L1-welcome')
  if (!welcomeTpl) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ccbabylife.com'
  let body = renderTemplate(welcomeTpl.body, { site_url: siteUrl })

  if (coupon) {
    body += `\n\n🎁 首單優惠碼：${coupon.code}\n結帳時輸入即可折抵。\n一鍵套用：${siteUrl}/coupon/redeem?code=${encodeURIComponent(coupon.code)}`
  }

  await pushText(lineUserId, body).catch((err) => {
    console.error('[line/webhook] welcome push failed:', err)
  })
}

// LINE sometimes pings GET to verify endpoint
export async function GET() {
  return new NextResponse('LINE webhook OK')
}
