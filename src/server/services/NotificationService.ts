import 'server-only'
import { and, eq, lt, or } from 'drizzle-orm'
import { db } from '@/db/client'
import { pushLogs, customers, type PushLog } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { isLineConfigured, pushText, LineApiError } from '@/lib/line-messaging'
import { getResend, isResendConfigured, FROM_DEFAULT } from '@/lib/resend-client'
import { renderBrandedEmail, type EmailMood } from '@/lib/email-templates'

interface QueueArgs {
  customerId: string
  channel: 'line' | 'email'
  templateId: string
  body: string
  subject?: string | null
  payload?: Record<string, unknown>
}

/**
 * Insert a push_logs row. Status starts as 'queued'.
 * Returns the row id.
 */
export async function enqueuePush(args: QueueArgs): Promise<string> {
  const [row] = await db
    .insert(pushLogs)
    .values({
      orgId: DEFAULT_ORG_ID,
      customerId: args.customerId,
      channel: args.channel,
      status: 'queued',
      templateId: args.templateId,
      subject: args.subject ?? null,
      body: args.body,
      payload: args.payload,
    })
    .returning({ id: pushLogs.id })
  return row.id
}

/**
 * Try to send a queued LINE push immediately.
 * Updates push_logs.status to 'sent' or 'failed'.
 * Swallows errors — caller does not need try/catch.
 */
/** Map templateId → email mood for branded template rendering */
function moodForTemplate(templateId: string): EmailMood {
  if (templateId.startsWith('order.shipped') || templateId.includes('shipping')) return 'shipping'
  if (templateId.startsWith('coupon') || templateId.includes('gift')) return 'gift'
  if (templateId.startsWith('order.paid') || templateId.includes('confirm')) return 'success'
  if (templateId.startsWith('restock')) return 'gift'
  return 'general'
}

function headingForTemplate(templateId: string, fallback: string): string {
  const map: Record<string, string> = {
    'order.paid': '訂單付款成功',
    'order.shipped': '訂單已出貨',
    'order.completed': '訂單完成',
    'coupon.granted': '一張新優惠券送給你',
    'cart.abandoned': '你的購物車還在等你',
    'restock.filled': '商品已重新到貨',
    'cutoff.reminder': '截單倒數提醒',
  }
  for (const key of Object.keys(map)) {
    if (templateId.startsWith(key)) return map[key]
  }
  return fallback
}

export async function trySendQueued(pushLogId: string): Promise<boolean> {
  const [row] = await db
    .select()
    .from(pushLogs)
    .where(eq(pushLogs.id, pushLogId))
    .limit(1)

  if (!row || row.status !== 'queued') return false

  // ── Email channel ─────────────────────────────────────────
  if (row.channel === 'email') {
    if (!isResendConfigured()) return false
    if (!row.customerId) {
      await markFailed(pushLogId, 'no customerId on email push_log')
      return false
    }

    const [customer] = await db
      .select({ email: customers.email, name: customers.name })
      .from(customers)
      .where(eq(customers.id, row.customerId))
      .limit(1)
    if (!customer?.email) {
      await markFailed(pushLogId, 'no email on customer')
      return false
    }

    try {
      const resend = getResend()
      if (!resend) return false
      const tplId = row.templateId ?? 'general'
      const subject = row.subject ?? headingForTemplate(tplId, '熙熙初日 通知')
      const html = renderBrandedEmail({
        preheader: subject.slice(0, 90),
        eyebrow: customer.name ? `${customer.name} さん` : undefined,
        heading: headingForTemplate(tplId, subject),
        mood: moodForTemplate(tplId),
        intro: row.body,
      })
      const result = await resend.emails.send({
        from: FROM_DEFAULT,
        to: customer.email,
        subject,
        html,
      })
      if (result.error) {
        await markFailed(pushLogId, result.error.message ?? 'resend error')
        return false
      }
      await db
        .update(pushLogs)
        .set({ status: 'sent', sentAt: new Date(), error: null })
        .where(eq(pushLogs.id, pushLogId))
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      await markFailed(pushLogId, msg)
      return false
    }
  }

  // ── LINE channel (existing behavior) ──────────────────────
  if (row.channel !== 'line') return false
  if (!isLineConfigured()) return false
  if (!row.customerId) return false

  const [customer] = await db
    .select({ lineUserId: customers.lineUserId })
    .from(customers)
    .where(eq(customers.id, row.customerId))
    .limit(1)

  if (!customer?.lineUserId) {
    await markFailed(pushLogId, 'no LINE userId on customer')
    return false
  }

  try {
    await pushText(customer.lineUserId, row.body)
    await db
      .update(pushLogs)
      .set({ status: 'sent', sentAt: new Date(), error: null })
      .where(eq(pushLogs.id, pushLogId))
    return true
  } catch (err) {
    const msg =
      err instanceof LineApiError
        ? `${err.statusCode}: ${err.details}`
        : err instanceof Error
        ? err.message
        : String(err)
    await markFailed(pushLogId, msg)
    return false
  }
}

async function markFailed(pushLogId: string, error: string) {
  await db
    .update(pushLogs)
    .set({ status: 'failed', error })
    .where(eq(pushLogs.id, pushLogId))
}

/**
 * Convenience: queue + send LINE push immediately. Returns sent=true if delivered.
 * If LINE not configured or customer has no lineUserId, the row stays queued
 * for later batch dispatch.
 */
export async function queueAndSendLine(args: {
  customerId: string
  templateId: string
  body: string
  payload?: Record<string, unknown>
}): Promise<{ pushLogId: string; sent: boolean }> {
  const pushLogId = await enqueuePush({
    customerId: args.customerId,
    channel: 'line',
    templateId: args.templateId,
    body: args.body,
    payload: args.payload,
  })
  const sent = await trySendQueued(pushLogId)
  return { pushLogId, sent }
}

/**
 * Dispatcher: pick queued rows, try sending each.
 * Used by /api/cron/dispatch-pushes for batch retry.
 */
export async function dispatchQueuedPushes(opts: {
  limit?: number
}): Promise<{ attempted: number; sent: number; failed: number }> {
  const limit = opts.limit ?? 100

  const rows: PushLog[] = await db
    .select()
    .from(pushLogs)
    .where(
      and(
        eq(pushLogs.orgId, DEFAULT_ORG_ID),
        eq(pushLogs.status, 'queued'),
        or(eq(pushLogs.channel, 'line'), eq(pushLogs.channel, 'email'))!
      )
    )
    .limit(limit)

  let sent = 0
  let failed = 0
  for (const r of rows) {
    const ok = await trySendQueued(r.id)
    if (ok) sent++
    else failed++
  }
  return { attempted: rows.length, sent, failed }
}

/**
 * Retry rows that previously failed (e.g. LINE 5xx, rate-limited).
 * Resets to 'queued' if last attempt is older than `olderThanMs`.
 */
export async function requeueOldFailures(opts: {
  olderThanMs: number
  limit?: number
}): Promise<number> {
  const cutoff = new Date(Date.now() - opts.olderThanMs)
  const rows = await db
    .select({ id: pushLogs.id })
    .from(pushLogs)
    .where(
      and(
        eq(pushLogs.status, 'failed'),
        eq(pushLogs.channel, 'line'),
        or(eq(pushLogs.sentAt, null as unknown as Date), lt(pushLogs.createdAt, cutoff))
      )
    )
    .limit(opts.limit ?? 100)

  if (rows.length === 0) return 0

  for (const r of rows) {
    await db
      .update(pushLogs)
      .set({ status: 'queued', error: null })
      .where(eq(pushLogs.id, r.id))
  }
  return rows.length
}
