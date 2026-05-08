'use server'

import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { cartSnapshots } from '@/db/schema/cart_snapshots'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { getCustomerSession } from '@/lib/customer-session'
import type { CartItem } from '@/types/cart'

/**
 * Persists the current cart server-side. Called from the client whenever the
 * cart changes (debounced). Only recorded if we know who they are
 * (logged-in customer OR an email cookie set during a previous checkout
 * attempt).
 */
export async function snapshotCartAction(items: CartItem[]): Promise<void> {
  const session = await getCustomerSession()
  if (!session) return // No identity → can't recover later

  const itemCount = items.reduce((s, i) => s + i.quantity, 0)
  const subtotal = items.reduce((s, i) => s + i.priceTwd * i.quantity, 0)

  if (items.length === 0) {
    // Empty cart: clear any pending snapshot for this customer
    await db
      .delete(cartSnapshots)
      .where(
        and(
          eq(cartSnapshots.orgId, DEFAULT_ORG_ID),
          eq(cartSnapshots.customerId, session.customerId)
        )
      )
    return
  }

  const [existing] = await db
    .select({ id: cartSnapshots.id })
    .from(cartSnapshots)
    .where(
      and(
        eq(cartSnapshots.orgId, DEFAULT_ORG_ID),
        eq(cartSnapshots.customerId, session.customerId)
      )
    )
    .limit(1)

  if (existing) {
    await db
      .update(cartSnapshots)
      .set({
        items,
        itemCount,
        subtotalTwd: subtotal,
        recoveryPushedAt: null, // re-armed if cart changes
        recoveredAt: null,
        updatedAt: new Date(),
      })
      .where(eq(cartSnapshots.id, existing.id))
  } else {
    await db.insert(cartSnapshots).values({
      orgId: DEFAULT_ORG_ID,
      customerId: session.customerId,
      email: session.email,
      items,
      itemCount,
      subtotalTwd: subtotal,
    })
  }
}
