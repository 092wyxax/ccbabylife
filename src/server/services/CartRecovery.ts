import 'server-only'
import { and, eq, isNotNull, isNull, lt, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { cartSnapshots, type CartSnapshot } from '@/db/schema/cart_snapshots'
import { customers } from '@/db/schema/customers'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { enqueuePush, queueAndSendLine } from './NotificationService'
import { renderBrandedEmail } from '@/lib/email-templates'
import { getResend, isResendConfigured, FROM_DEFAULT } from '@/lib/resend-client'
import { formatTwd } from '@/lib/format'
import type { CartItem } from '@/types/cart'

/**
 * Send abandonment-recovery messages to customers who:
 *   - have a cart snapshot updated > 4 hours ago
 *   - have NOT placed any matching order since (recoveredAt is null)
 *   - have NOT been pinged yet (recoveryPushedAt is null)
 *
 * Idempotent: each snapshot row is pushed at most once.
 */
export async function dispatchCartRecoveryPushes(): Promise<{
  matched: number
  pushed: number
}> {
  // 4-hour staleness window (Postgres-side comparison to avoid TZ issues)
  const stale = sql`now() - interval '4 hours'`

  const rows = await db
    .select({
      snap: cartSnapshots,
      customer: customers,
    })
    .from(cartSnapshots)
    .innerJoin(customers, eq(customers.id, cartSnapshots.customerId))
    .where(
      and(
        eq(cartSnapshots.orgId, DEFAULT_ORG_ID),
        isNotNull(cartSnapshots.customerId),
        isNull(cartSnapshots.recoveredAt),
        isNull(cartSnapshots.recoveryPushedAt),
        lt(cartSnapshots.updatedAt, stale)
      )
    )
    .limit(500)

  if (rows.length === 0) return { matched: 0, pushed: 0 }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ccbabylife.com'
  let pushed = 0

  for (const { snap, customer } of rows) {
    if (customer.isBlacklisted) continue
    const items = (snap.items as CartItem[]) ?? []
    if (items.length === 0) continue

    const top = items.slice(0, 3).map((i) => `· ${i.nameZh} × ${i.quantity}`).join('\n')
    const more = items.length > 3 ? `\n…還有 ${items.length - 3} 項` : ''
    const body = `你的購物車還在等你 🛒\n\n${top}${more}\n\n小計：${formatTwd(snap.subtotalTwd)}\n\n👉 回去結帳：\n${siteUrl}/cart`
    const subject = `你的購物車還有 ${items.length} 項商品`

    const prefs = customer.notificationPrefs ?? { line: true, email: true }

    if (prefs.line && customer.lineUserId) {
      await queueAndSendLine({
        customerId: customer.id,
        templateId: 'cart.abandoned',
        body,
        payload: { snapshotId: snap.id, itemCount: snap.itemCount },
      }).catch(() => {})
    }
    if (prefs.email) {
      await enqueuePush({
        customerId: customer.id,
        channel: 'email',
        templateId: 'cart.abandoned',
        subject,
        body,
        payload: { snapshotId: snap.id, itemCount: snap.itemCount },
      }).catch(() => {})
    }

    await db
      .update(cartSnapshots)
      .set({ recoveryPushedAt: new Date() })
      .where(eq(cartSnapshots.id, snap.id))
    pushed++
  }

  // ── Guest snapshots (no customerId, has email) — email only ──
  const guestRows = await db
    .select()
    .from(cartSnapshots)
    .where(
      and(
        eq(cartSnapshots.orgId, DEFAULT_ORG_ID),
        isNull(cartSnapshots.customerId),
        isNotNull(cartSnapshots.email),
        isNull(cartSnapshots.recoveredAt),
        isNull(cartSnapshots.recoveryPushedAt),
        lt(cartSnapshots.updatedAt, stale)
      )
    )
    .limit(200)

  let guestPushed = 0
  for (const snap of guestRows as CartSnapshot[]) {
    if (!snap.email) continue
    const items = (snap.items as CartItem[]) ?? []
    if (items.length === 0) continue
    if (!isResendConfigured()) break

    const top = items.slice(0, 3).map((i) => `· ${i.nameZh} × ${i.quantity}`).join('\n')
    const more = items.length > 3 ? `\n…還有 ${items.length - 3} 項` : ''
    const subject = `你的購物車還有 ${items.length} 項商品`
    const body = `你的購物車還在等你 🛒\n\n${top}${more}\n\n小計：${formatTwd(snap.subtotalTwd)}\n\n👉 回去結帳：\n${siteUrl}/cart`

    try {
      const resend = getResend()
      if (!resend) break
      await resend.emails.send({
        from: FROM_DEFAULT,
        to: snap.email,
        subject,
        html: renderBrandedEmail({
          preheader: subject,
          eyebrow: 'カートのご案内',
          heading: '你的購物車還在等你',
          mood: 'general',
          intro: body,
          ctaLabel: '回去結帳',
          ctaUrl: `${siteUrl}/cart`,
        }),
      })
      await db
        .update(cartSnapshots)
        .set({ recoveryPushedAt: new Date() })
        .where(eq(cartSnapshots.id, snap.id))
      guestPushed++
    } catch (e) {
      console.error('[CartRecovery] guest push failed:', e)
    }
  }

  return { matched: rows.length + guestRows.length, pushed: pushed + guestPushed }
}
