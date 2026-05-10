'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { and, count, eq, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { pushLogs } from '@/db/schema/push_logs'
import { newsletterSubscribers } from '@/db/schema/newsletter'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { getResend, FROM_DEFAULT, isResendConfigured } from '@/lib/resend-client'
import { requireRole } from '@/server/services/AdminAuthService'

const inputSchema = z.object({
  subject: z.string().trim().min(3, '主旨至少 3 個字').max(200, '主旨上限 200 字'),
  body: z.string().trim().min(10, '內文至少 10 個字').max(20000, '內文上限 20000 字'),
  confirmCount: z.string().regex(/^\d+$/, '請填數字').optional(),
})

export interface EmailBroadcastResult {
  ok?: boolean
  error?: string
  audienceCount?: number
  sentCount?: number
  sentAt?: string
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ccbabylife.com'

/**
 * Render plain-text body to a minimal HTML email with brand styling.
 * Single-pass: turns \n\n into paragraphs, \n into <br>. Adds an
 * unsubscribe footer pointing to the standard unsubscribe link.
 */
function renderEmailHtml(body: string, unsubscribeToken?: string): string {
  const escaped = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const paragraphs = escaped
    .split(/\n\n+/)
    .map((p) => `<p style="margin:0 0 12px;line-height:1.7">${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n')

  const unsubLink = unsubscribeToken
    ? `${SITE_URL}/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`
    : `${SITE_URL}/account/settings`

  return `<!doctype html>
<html lang="zh-Hant">
<body style="background:#f7f3ec;color:#2d2a26;font-family:'Noto Sans TC',sans-serif;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e0d6;border-radius:8px;padding:32px 28px;">
    ${paragraphs}
    <hr style="border:none;border-top:1px solid #e5e0d6;margin:24px 0">
    <p style="font-size:11px;color:#998c7d;line-height:1.6">
      你會收到這封信是因為訂閱了熙熙初日電子報。<br>
      不想再收到？<a href="${unsubLink}" style="color:#998c7d">點此取消訂閱</a>
    </p>
  </div>
</body>
</html>`
}

export async function sendEmailBroadcastAction(
  _prev: EmailBroadcastResult | undefined,
  formData: FormData
): Promise<EmailBroadcastResult> {
  const me = await requireRole(['owner', 'manager', 'editor'])

  if (!isResendConfigured()) {
    return { error: 'RESEND_API_KEY 未設定，無法寄送。' }
  }

  const parsed = inputSchema.safeParse({
    subject: formData.get('subject'),
    body: formData.get('body'),
    confirmCount: formData.get('confirmCount') ?? undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '欄位錯誤' }
  }

  const subscribers = await db
    .select({
      id: newsletterSubscribers.id,
      email: newsletterSubscribers.email,
    })
    .from(newsletterSubscribers)
    .where(
      and(
        eq(newsletterSubscribers.orgId, DEFAULT_ORG_ID),
        eq(newsletterSubscribers.isActive, true)
      )
    )

  const audienceCount = subscribers.length

  if (parsed.data.confirmCount == null) {
    return { audienceCount, error: '請按「確認送出」以送出。' }
  }
  if (Number(parsed.data.confirmCount) !== audienceCount) {
    return { audienceCount, error: '名單數已變動，請重新確認。' }
  }
  if (audienceCount === 0) {
    return { audienceCount, error: '目前沒有有效訂閱者。' }
  }

  const resend = getResend()!
  const html = renderEmailHtml(parsed.data.body)
  const text = parsed.data.body

  let sentCount = 0
  // Resend supports `to` as an array up to 50 recipients per call. Chunk.
  const CHUNK = 50
  for (let i = 0; i < subscribers.length; i += CHUNK) {
    const chunk = subscribers.slice(i, i + CHUNK)
    try {
      await resend.emails.send({
        from: FROM_DEFAULT,
        to: chunk.map((s) => s.email),
        subject: parsed.data.subject,
        html,
        text,
      })
      sentCount += chunk.length
    } catch (err) {
      console.error('[email-broadcast] chunk failed:', err)
    }
  }

  await db.insert(pushLogs).values({
    orgId: DEFAULT_ORG_ID,
    customerId: null,
    channel: 'email',
    templateId: 'admin.broadcast',
    subject: parsed.data.subject,
    body: parsed.data.body,
    payload: { senderId: me.id, audienceCount, sentCount },
    status: sentCount > 0 ? 'sent' : 'failed',
    sentAt: sentCount > 0 ? new Date() : null,
  })

  revalidatePath('/admin/newsletter')
  revalidatePath('/admin/newsletter/broadcast')

  return {
    ok: sentCount > 0,
    sentCount,
    audienceCount,
    sentAt: new Date().toISOString(),
    error: sentCount === 0 ? '所有寄送均失敗，請檢查 Resend log。' : undefined,
  }
}

export async function getEmailAudienceCount(): Promise<number> {
  await requireRole(['owner', 'manager', 'editor'])
  const [row] = await db
    .select({ value: count() })
    .from(newsletterSubscribers)
    .where(
      and(
        eq(newsletterSubscribers.orgId, DEFAULT_ORG_ID),
        eq(newsletterSubscribers.isActive, true)
      )
    )
  return row?.value ?? 0
}

export async function listRecentEmailBroadcasts(): Promise<
  Array<{
    id: string
    subject: string | null
    body: string
    sentAt: Date | null
    status: string
    payload: unknown
  }>
> {
  await requireRole(['owner', 'manager', 'editor'])
  const rows = await db
    .select({
      id: pushLogs.id,
      subject: pushLogs.subject,
      body: pushLogs.body,
      sentAt: pushLogs.sentAt,
      status: pushLogs.status,
      payload: pushLogs.payload,
    })
    .from(pushLogs)
    .where(
      sql`${pushLogs.orgId} = ${DEFAULT_ORG_ID} AND ${pushLogs.channel} = 'email' AND ${pushLogs.templateId} = 'admin.broadcast'`
    )
    .orderBy(sql`${pushLogs.createdAt} DESC`)
    .limit(20)
  return rows
}
