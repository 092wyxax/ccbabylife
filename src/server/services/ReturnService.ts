import 'server-only'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  returnRequests,
  type ReturnRequest,
  type ReturnStatus,
  type ReturnType,
} from '@/db/schema/return_requests'
import { orders, orderItems, customers, type Order } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

const REQUEST_PREFIX = 'R'

function makeRequestNumber(): string {
  const d = new Date()
  const yyMMdd =
    String(d.getFullYear()).slice(2) +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${REQUEST_PREFIX}${yyMMdd}-${rand}`
}

/** Whether an order is eligible for a return request right now. */
export function canRequestReturn(order: Pick<Order, 'status'>): boolean {
  return order.status === 'shipped' || order.status === 'completed' || order.status === 'arrived_tw'
}

export interface CreateReturnInput {
  orderId: string
  customerId: string
  type: ReturnType
  reason: string
  /** Subset of order items being returned. Empty = entire order. */
  selectedOrderItemIds?: string[]
  photoPaths?: string[]
}

export async function createReturnRequest(input: CreateReturnInput): Promise<ReturnRequest> {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, input.orderId), eq(orders.orgId, DEFAULT_ORG_ID)))
    .limit(1)
  if (!order) throw new Error('Order not found')
  if (order.customerId !== input.customerId) {
    throw new Error('Order does not belong to this customer')
  }
  if (!canRequestReturn(order)) {
    throw new Error('此訂單目前狀態無法申請退換貨')
  }

  // Snapshot order items
  const allItems = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))

  const selected = input.selectedOrderItemIds && input.selectedOrderItemIds.length > 0
    ? allItems.filter((i) => input.selectedOrderItemIds!.includes(i.id))
    : allItems

  if (selected.length === 0) throw new Error('未選擇任何商品')

  const itemsSnapshot = selected.map((it) => ({
    orderItemId: it.id,
    productNameSnapshot: it.productNameSnapshot,
    quantity: it.quantity,
    lineTotal: it.lineTotal,
  }))

  const refundTwd = selected.reduce((s, it) => s + it.lineTotal, 0)

  const [row] = await db
    .insert(returnRequests)
    .values({
      orgId: DEFAULT_ORG_ID,
      orderId: input.orderId,
      customerId: input.customerId,
      requestNumber: makeRequestNumber(),
      type: input.type,
      reason: input.reason,
      photoPaths: input.photoPaths && input.photoPaths.length > 0 ? input.photoPaths : null,
      itemsSnapshot,
      refundTwd,
    })
    .returning()
  return row
}

export async function getReturnRequest(id: string): Promise<ReturnRequest | null> {
  const [row] = await db
    .select()
    .from(returnRequests)
    .where(and(eq(returnRequests.id, id), eq(returnRequests.orgId, DEFAULT_ORG_ID)))
    .limit(1)
  return row ?? null
}

export async function listReturnsForCustomer(customerId: string): Promise<ReturnRequest[]> {
  return db
    .select()
    .from(returnRequests)
    .where(
      and(
        eq(returnRequests.orgId, DEFAULT_ORG_ID),
        eq(returnRequests.customerId, customerId)
      )
    )
    .orderBy(desc(returnRequests.createdAt))
}

export async function listReturnsForOrder(orderId: string): Promise<ReturnRequest[]> {
  return db
    .select()
    .from(returnRequests)
    .where(
      and(eq(returnRequests.orgId, DEFAULT_ORG_ID), eq(returnRequests.orderId, orderId))
    )
    .orderBy(desc(returnRequests.createdAt))
}

export interface AdminReturnRow {
  request: ReturnRequest
  order: Order | null
  customerName: string | null
  customerEmail: string | null
}

export async function listReturnsForAdmin(opts?: {
  status?: ReturnStatus
  limit?: number
}): Promise<AdminReturnRow[]> {
  const conds = [eq(returnRequests.orgId, DEFAULT_ORG_ID)]
  if (opts?.status) conds.push(eq(returnRequests.status, opts.status))

  const rows = await db
    .select({
      request: returnRequests,
      order: orders,
      customerName: customers.name,
      customerEmail: customers.email,
    })
    .from(returnRequests)
    .leftJoin(orders, eq(orders.id, returnRequests.orderId))
    .leftJoin(customers, eq(customers.id, returnRequests.customerId))
    .where(and(...conds))
    .orderBy(desc(returnRequests.createdAt))
    .limit(opts?.limit ?? 100)

  return rows
}

export async function updateReturnStatus(
  id: string,
  next: ReturnStatus,
  opts?: { handledById?: string; internalNotes?: string; refundTwd?: number }
): Promise<ReturnRequest> {
  const [row] = await db
    .update(returnRequests)
    .set({
      status: next,
      handledById: opts?.handledById ?? null,
      handledAt: new Date(),
      internalNotes: opts?.internalNotes ?? undefined,
      refundTwd: opts?.refundTwd ?? undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(returnRequests.id, id), eq(returnRequests.orgId, DEFAULT_ORG_ID)))
    .returning()
  return row
}
