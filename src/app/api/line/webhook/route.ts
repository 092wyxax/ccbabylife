import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { db } from '@/db/client'
import { lineMessages } from '@/db/schema/line_messages'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

/**
 * LINE Messaging API webhook receiver.
 *
 * Configure in LINE Developers Console:
 *   Webhook URL: https://ccbabylife.com/api/line/webhook
 *   Use webhook: ON
 *
 * Validates X-Line-Signature against LINE_MESSAGING_CHANNEL_SECRET.
 * Stores every inbound text message in line_messages for the admin inbox.
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

// LINE sometimes pings GET to verify endpoint
export async function GET() {
  return new NextResponse('LINE webhook OK')
}
