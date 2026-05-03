import 'server-only'
import { and, eq, lt, or } from 'drizzle-orm'
import { db } from '@/db/client'
import { pushLogs, customers, type PushLog } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { isLineConfigured, pushText, LineApiError } from '@/lib/line-messaging'

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
export async function trySendQueued(pushLogId: string): Promise<boolean> {
  const [row] = await db
    .select()
    .from(pushLogs)
    .where(eq(pushLogs.id, pushLogId))
    .limit(1)

  if (!row || row.status !== 'queued') return false
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
        eq(pushLogs.channel, 'line')
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
