import 'server-only'
import { and, eq, gte, isNotNull, isNull, lt, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { cartSnapshots } from '@/db/schema/cart_snapshots'
import { customers } from '@/db/schema/customers'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { enqueuePush, queueAndSendLine } from './NotificationService'
import { formatTwd } from '@/lib/format'
import type { CartItem } from '@/types/cart'

/**
 * Find customers with active cart_snapshots whose cutoff is approaching
 * (configurable; default 6h before next Sunday 23:59 Taipei) and remind them.
 *
 * Idempotent via cart_snapshots.recoveryPushedAt — same snapshot is never
 * re-pushed within a single cutoff window.
 *
 * Strategy: piggyback on cart_snapshots' recoveryPushedAt flag (we mark it
 * after sending so the existing 4-hour cart-abandonment cron won't re-fire,
 * and a new cutoff push won't double-fire either).
 */
export async function dispatchCutoffReminders(opts?: {
  /** Hours before this Sunday 23:59 TPE within which we remind. Default 6h. */
  windowHours?: number
}): Promise<{ matched: number; pushed: number }> {
  const windowHours = opts?.windowHours ?? 6

  // Compute next Sunday 23:59 in Taipei (UTC+8)
  const nowUtc = new Date()
  const tpeNow = new Date(nowUtc.getTime() + 8 * 60 * 60 * 1000)
  const dow = tpeNow.getUTCDay() // 0=Sun, 6=Sat
  const daysUntilSun = (7 - dow) % 7 // 0 if today is Sun
  const cutoffTpe = new Date(tpeNow)
  cutoffTpe.setUTCDate(cutoffTpe.getUTCDate() + daysUntilSun)
  cutoffTpe.setUTCHours(23, 59, 0, 0)
  // back to UTC
  const cutoffUtc = new Date(cutoffTpe.getTime() - 8 * 60 * 60 * 1000)

  const hoursUntilCutoff = (cutoffUtc.getTime() - nowUtc.getTime()) / (60 * 60 * 1000)
  // Only run if we're inside the window AND not past cutoff
  if (hoursUntilCutoff > windowHours || hoursUntilCutoff < 0) {
    return { matched: 0, pushed: 0 }
  }

  // Find carts with content, attached to a customer, not recovered, not yet pushed
  const rows = await db
    .select({ snap: cartSnapshots, customer: customers })
    .from(cartSnapshots)
    .innerJoin(customers, eq(customers.id, cartSnapshots.customerId))
    .where(
      and(
        eq(cartSnapshots.orgId, DEFAULT_ORG_ID),
        isNotNull(cartSnapshots.customerId),
        isNull(cartSnapshots.recoveredAt),
        isNull(cartSnapshots.recoveryPushedAt),
        gte(cartSnapshots.itemCount, 1)
      )
    )
    .limit(500)

  if (rows.length === 0) return { matched: 0, pushed: 0 }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ccbabylife.com'
  const hoursLabel = Math.max(1, Math.floor(hoursUntilCutoff))

  let pushed = 0
  for (const { snap, customer } of rows) {
    if (customer.isBlacklisted) continue
    const items = (snap.items as CartItem[]) ?? []
    if (items.length === 0) continue

    const top = items.slice(0, 3).map((i) => `· ${i.nameZh} × ${i.quantity}`).join('\n')
    const more = items.length > 3 ? `\n…還有 ${items.length - 3} 項` : ''
    const subject = `截單倒數 ${hoursLabel} 小時 · 你的購物車還在等你`
    const body = `這週日 23:59 截單，再 ${hoursLabel} 小時就要過囉！\n\n${top}${more}\n\n小計：${formatTwd(snap.subtotalTwd)}\n\n👉 立即結帳：\n${siteUrl}/checkout`
    const prefs = customer.notificationPrefs ?? { line: true, email: true }

    if (prefs.line && customer.lineUserId) {
      await queueAndSendLine({
        customerId: customer.id,
        templateId: 'cutoff.reminder',
        body,
        payload: { snapshotId: snap.id, hoursUntilCutoff: hoursLabel },
      }).catch(() => {})
    }
    if (prefs.email) {
      await enqueuePush({
        customerId: customer.id,
        channel: 'email',
        templateId: 'cutoff.reminder',
        subject,
        body,
        payload: { snapshotId: snap.id, hoursUntilCutoff: hoursLabel },
      }).catch(() => {})
    }

    await db
      .update(cartSnapshots)
      .set({ recoveryPushedAt: new Date() })
      .where(eq(cartSnapshots.id, snap.id))
    pushed++
  }

  return { matched: rows.length, pushed }
}
