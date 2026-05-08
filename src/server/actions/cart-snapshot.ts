'use server'

import { and, eq, isNull } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { db } from '@/db/client'
import { cartSnapshots } from '@/db/schema/cart_snapshots'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { getCustomerSession } from '@/lib/customer-session'
import type { CartItem } from '@/types/cart'

const GUEST_EMAIL_COOKIE = 'guest_email'
const GUEST_EMAIL_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

/**
 * Persists the current cart server-side. Called from the client whenever the
 * cart changes (debounced). Records when:
 *   1. logged-in customer (keyed by customerId)
 *   2. guest with guest_email cookie (keyed by email)
 *   3. otherwise no-op (we have no way to reach them)
 */
export async function snapshotCartAction(items: CartItem[]): Promise<void> {
  const session = await getCustomerSession()
  const cookieStore = await cookies()
  const guestEmail = !session
    ? cookieStore.get(GUEST_EMAIL_COOKIE)?.value
    : undefined

  // No identity at all → can't recover later
  if (!session && !guestEmail) return

  const itemCount = items.reduce((s, i) => s + i.quantity, 0)
  const subtotal = items.reduce((s, i) => s + i.priceTwd * i.quantity, 0)

  // Empty cart → delete the pending snapshot
  if (items.length === 0) {
    if (session) {
      await db
        .delete(cartSnapshots)
        .where(
          and(
            eq(cartSnapshots.orgId, DEFAULT_ORG_ID),
            eq(cartSnapshots.customerId, session.customerId)
          )
        )
    } else if (guestEmail) {
      await db
        .delete(cartSnapshots)
        .where(
          and(
            eq(cartSnapshots.orgId, DEFAULT_ORG_ID),
            isNull(cartSnapshots.customerId),
            eq(cartSnapshots.email, guestEmail.toLowerCase())
          )
        )
    }
    return
  }

  // Look up existing — by customerId if logged in, else by guest email
  const whereCond = session
    ? and(
        eq(cartSnapshots.orgId, DEFAULT_ORG_ID),
        eq(cartSnapshots.customerId, session.customerId)
      )
    : and(
        eq(cartSnapshots.orgId, DEFAULT_ORG_ID),
        isNull(cartSnapshots.customerId),
        eq(cartSnapshots.email, guestEmail!.toLowerCase())
      )

  const [existing] = await db
    .select({ id: cartSnapshots.id })
    .from(cartSnapshots)
    .where(whereCond)
    .limit(1)

  if (existing) {
    await db
      .update(cartSnapshots)
      .set({
        items,
        itemCount,
        subtotalTwd: subtotal,
        recoveryPushedAt: null, // re-arm
        recoveredAt: null,
        updatedAt: new Date(),
      })
      .where(eq(cartSnapshots.id, existing.id))
  } else {
    await db.insert(cartSnapshots).values({
      orgId: DEFAULT_ORG_ID,
      customerId: session?.customerId ?? null,
      email: session?.email ?? guestEmail!.toLowerCase(),
      items,
      itemCount,
      subtotalTwd: subtotal,
    })
  }
}

const emailSchema = z.string().email().max(200)

/** Stash guest email cookie when typed in checkout (even if not submitted). */
export async function setGuestEmailAction(email: string): Promise<void> {
  const parsed = emailSchema.safeParse(email)
  if (!parsed.success) return
  const cookieStore = await cookies()
  cookieStore.set(GUEST_EMAIL_COOKIE, parsed.data.toLowerCase(), {
    maxAge: GUEST_EMAIL_MAX_AGE,
    sameSite: 'lax',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
}
