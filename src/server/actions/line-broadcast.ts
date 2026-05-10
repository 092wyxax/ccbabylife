'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/db/client'
import { pushLogs } from '@/db/schema/push_logs'
import { customers } from '@/db/schema/customers'
import { count, eq, isNotNull, sql } from 'drizzle-orm'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { broadcastText, isLineConfigured } from '@/lib/line-messaging'
import { requireRole } from '@/server/services/AdminAuthService'

const inputSchema = z.object({
  body: z.string().trim().min(5, '訊息至少 5 個字').max(5000, '訊息上限 5000 字'),
  confirmCount: z.string().regex(/^\d+$/, '請填數字').optional(),
})

export interface LineBroadcastResult {
  ok?: boolean
  error?: string
  audienceEstimate?: number
  sentAt?: string
}

/**
 * Send a LINE OA broadcast to ALL followers. Costs 1 push per follower
 * out of monthly quota — use sparingly. Caller must confirm by passing
 * `confirmCount` matching the current audience estimate to prevent
 * accidental double-sends.
 */
export async function sendLineBroadcastAction(
  _prev: LineBroadcastResult | undefined,
  formData: FormData
): Promise<LineBroadcastResult> {
  const me = await requireRole(['owner', 'manager', 'editor'])

  if (!isLineConfigured()) {
    return { error: 'LINE_MESSAGING_ACCESS_TOKEN 未設定，無法群發。' }
  }

  const parsed = inputSchema.safeParse({
    body: formData.get('body'),
    confirmCount: formData.get('confirmCount') ?? undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '欄位錯誤' }
  }

  // Audience estimate = customers with linked LINE userId. (Real broadcast
  // hits ALL followers, including unlinked. We show this as a lower-bound.)
  const [audRow] = await db
    .select({ value: count() })
    .from(customers)
    .where(
      sql`${customers.orgId} = ${DEFAULT_ORG_ID} AND ${isNotNull(customers.lineUserId)}`
    )
  const audienceEstimate = audRow?.value ?? 0

  if (parsed.data.confirmCount == null) {
    return { audienceEstimate, error: '請再次按「確認送出」以送出。' }
  }
  if (Number(parsed.data.confirmCount) !== audienceEstimate) {
    return {
      audienceEstimate,
      error: '名單數已變動，請重新確認。',
    }
  }

  try {
    await broadcastText(parsed.data.body)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'LINE API 失敗'
    return { error: msg }
  }

  // Audit log via push_logs (single summary row; broadcast doesn't have per-recipient log)
  await db.insert(pushLogs).values({
    orgId: DEFAULT_ORG_ID,
    customerId: null,
    channel: 'line',
    templateId: 'admin.broadcast',
    body: parsed.data.body,
    payload: { senderId: me.id, audienceEstimate },
    status: 'sent',
    sentAt: new Date(),
  })

  revalidatePath('/admin/marketing/broadcast')

  return { ok: true, sentAt: new Date().toISOString(), audienceEstimate }
}

/** Read-only: estimate audience for the form (linked LINE customers). */
export async function getLineAudienceEstimate(): Promise<number> {
  await requireRole(['owner', 'manager', 'editor'])
  const [row] = await db
    .select({ value: count() })
    .from(customers)
    .where(
      sql`${customers.orgId} = ${DEFAULT_ORG_ID} AND ${customers.lineUserId} IS NOT NULL`
    )
  return row?.value ?? 0
}

/** Last 20 broadcast records for history pane. */
export async function listRecentLineBroadcasts(): Promise<
  Array<{ id: string; body: string; sentAt: Date | null; status: string }>
> {
  await requireRole(['owner', 'manager', 'editor'])
  const rows = await db
    .select({
      id: pushLogs.id,
      body: pushLogs.body,
      sentAt: pushLogs.sentAt,
      status: pushLogs.status,
    })
    .from(pushLogs)
    .where(
      sql`${pushLogs.orgId} = ${DEFAULT_ORG_ID} AND ${pushLogs.templateId} = 'admin.broadcast'`
    )
    .orderBy(sql`${pushLogs.createdAt} DESC`)
    .limit(20)
  return rows
}
