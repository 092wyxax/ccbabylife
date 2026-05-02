import 'server-only'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  orders,
  orderItems,
  orderStatusLogs,
  customers,
  adminUsers,
  type Order,
  type OrderItem,
  type OrderStatusLog,
  type Customer,
  type AdminUser,
} from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import type { OrderStatus } from '@/db/schema'
import {
  canTransition,
  InvalidStatusTransitionError,
  TRANSITIONS,
} from '@/lib/order-state-machine'

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

export function listValidNextStatuses(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from]
}

export interface OrderDetail {
  order: Order
  customer: Customer | null
  items: OrderItem[]
  logs: Array<OrderStatusLog & { actorName: string | null }>
}

export async function getOrderForAdmin(orderId: string): Promise<OrderDetail | null> {
  const orderRow = await db
    .select({ order: orders, customer: customers })
    .from(orders)
    .leftJoin(customers, eq(customers.id, orders.customerId))
    .where(and(eq(orders.id, orderId), eq(orders.orgId, DEFAULT_ORG_ID)))
    .limit(1)

  const row = orderRow[0]
  if (!row) return null

  const [items, logs] = await Promise.all([
    db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))
      .orderBy(asc(orderItems.createdAt)),
    db
      .select({
        log: orderStatusLogs,
        actor: adminUsers,
      })
      .from(orderStatusLogs)
      .leftJoin(adminUsers, eq(adminUsers.id, orderStatusLogs.actorId))
      .where(eq(orderStatusLogs.orderId, orderId))
      .orderBy(asc(orderStatusLogs.createdAt)),
  ])

  return {
    order: row.order,
    customer: row.customer,
    items,
    logs: logs.map((l) => ({ ...l.log, actorName: l.actor?.name ?? null })),
  }
}

/**
 * Customer-facing detail (for /track/[orderId]). Excludes admin-only fields
 * such as ECPay trade no and customer phone.
 */
export interface OrderTrackingDetail {
  order: Order
  items: OrderItem[]
}

export async function getOrderForTracking(
  orderId: string
): Promise<OrderTrackingDetail | null> {
  const detail = await getOrderForAdmin(orderId)
  if (!detail) return null
  return { order: detail.order, items: detail.items }
}
