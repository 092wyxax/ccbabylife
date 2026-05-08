import 'server-only'
import webpush from 'web-push'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/db/client'
import { pushSubscriptions, type PushSubscription } from '@/db/schema/push_subscriptions'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

let configured = false
function configure(): boolean {
  if (configured) return true
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!pub || !priv || !subject) return false
  webpush.setVapidDetails(subject, pub, priv)
  configured = true
  return true
}

export function isWebPushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT
  )
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
  /** Pass-through to notification.data — accessible in SW click handler */
  data?: Record<string, unknown>
}

export async function saveSubscription(opts: {
  customerId: string | null
  endpoint: string
  p256dhKey: string
  authKey: string
  userAgent?: string
}): Promise<void> {
  await db
    .insert(pushSubscriptions)
    .values({
      orgId: DEFAULT_ORG_ID,
      customerId: opts.customerId,
      endpoint: opts.endpoint,
      p256dhKey: opts.p256dhKey,
      authKey: opts.authKey,
      userAgent: opts.userAgent ?? null,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        customerId: opts.customerId,
        p256dhKey: opts.p256dhKey,
        authKey: opts.authKey,
        userAgent: opts.userAgent ?? null,
      },
    })
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint))
}

export async function listSubscriptionsForCustomer(
  customerId: string
): Promise<PushSubscription[]> {
  return db
    .select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.orgId, DEFAULT_ORG_ID),
        eq(pushSubscriptions.customerId, customerId)
      )
    )
}

/**
 * Send to one subscription. Returns true on success. Auto-cleans up
 * 410/404 responses (browser unsubscribed).
 */
async function sendToSubscription(
  sub: PushSubscription,
  payload: PushPayload
): Promise<boolean> {
  if (!configure()) return false
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dhKey, auth: sub.authKey },
      },
      JSON.stringify(payload)
    )
    await db
      .update(pushSubscriptions)
      .set({ lastSentAt: new Date() })
      .where(eq(pushSubscriptions.id, sub.id))
    return true
  } catch (e) {
    const err = e as { statusCode?: number; message?: string }
    if (err.statusCode === 404 || err.statusCode === 410) {
      // Subscription expired/unsubscribed
      await deleteSubscription(sub.endpoint)
    } else {
      console.error('[webpush] send failed:', err.statusCode, err.message)
    }
    return false
  }
}

/** Send to every subscription bound to this customer (all their devices). */
export async function pushToCustomer(
  customerId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  if (!configure()) return { sent: 0, failed: 0 }
  const subs = await listSubscriptionsForCustomer(customerId)
  let sent = 0
  let failed = 0
  for (const s of subs) {
    const ok = await sendToSubscription(s, payload)
    if (ok) sent++
    else failed++
  }
  return { sent, failed }
}

/** Send to multiple customers (fan-out). */
export async function pushToCustomers(
  customerIds: string[],
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  if (customerIds.length === 0 || !configure()) return { sent: 0, failed: 0 }
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.orgId, DEFAULT_ORG_ID),
        inArray(pushSubscriptions.customerId, customerIds)
      )
    )
  let sent = 0
  let failed = 0
  for (const s of subs) {
    const ok = await sendToSubscription(s, payload)
    if (ok) sent++
    else failed++
  }
  return { sent, failed }
}
