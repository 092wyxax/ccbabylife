import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { orders, orderStatusLogs } from '@/db/schema'
import type { OrderStatus, AdminUser } from '@/db/schema'
import { canTransition, InvalidStatusTransitionError } from '@/lib/order-state-machine'

export { canTransition, InvalidStatusTransitionError }

export async function changeStatus(
  orderId: string,
  to: OrderStatus,
  actor: AdminUser,
  reason?: string
) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) })
  if (!order) throw new Error(`Order not found: ${orderId}`)

  if (!canTransition(order.status, to)) {
    throw new InvalidStatusTransitionError(order.status, to)
  }

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ status: to, updatedAt: new Date() })
      .where(eq(orders.id, orderId))

    await tx.insert(orderStatusLogs).values({
      orgId: order.orgId,
      orderId,
      fromStatus: order.status,
      toStatus: to,
      actorId: actor.id,
      reason,
    })
  })

  return { from: order.status, to }
}
