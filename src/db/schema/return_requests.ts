import { pgTable, uuid, text, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { customers } from './customers'
import { orders } from './orders'
import { adminUsers } from './admin_users'

export const returnTypeEnum = ['return', 'exchange'] as const
export type ReturnType = (typeof returnTypeEnum)[number]

export const returnStatusEnum = [
  'pending', // 客戶剛提出，等待審核
  'approved', // 同意，等收到退回商品
  'rejected', // 拒絕
  'received', // 已收到退回商品
  'refunded', // 退款 / 換貨完成
  'cancelled', // 客戶或客服取消
] as const
export type ReturnStatus = (typeof returnStatusEnum)[number]

export const returnRequests = pgTable(
  'return_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').notNull().references(() => customers.id),
    /** 6-digit human-friendly number for support phone calls (e.g. R251108-001) */
    requestNumber: text('request_number').notNull().unique(),
    type: text('type', { enum: returnTypeEnum }).notNull(),
    status: text('status', { enum: returnStatusEnum }).notNull().default('pending'),
    /** Customer's reason — max 1000 chars */
    reason: text('reason').notNull(),
    /** Optional list of customer-uploaded photo URLs / paths */
    photoPaths: text('photo_paths').array(),
    /** Snapshot of which order items they want to return */
    itemsSnapshot: jsonb('items_snapshot').$type<Array<{
      orderItemId: string
      productNameSnapshot: string
      quantity: number
      lineTotal: number
    }>>(),
    /** Refund amount in TWD if approved */
    refundTwd: integer('refund_twd'),
    /** Admin notes (internal) */
    internalNotes: text('internal_notes'),
    /** Admin who handled it */
    handledById: uuid('handled_by_id').references(() => adminUsers.id),
    handledAt: timestamp('handled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('returns_org_status_idx').on(table.orgId, table.status),
    index('returns_order_idx').on(table.orderId),
    index('returns_customer_idx').on(table.customerId),
  ]
)

export type ReturnRequest = typeof returnRequests.$inferSelect
export type NewReturnRequest = typeof returnRequests.$inferInsert
