import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { adminUsers } from './admin_users'
import { products } from './products'

export const supplierTypeEnum = [
  'rakuten',
  'amazon_jp',
  'superdelivery',
  'direct',
  'other',
] as const
export type SupplierType = (typeof supplierTypeEnum)[number]

export const suppliers = pgTable(
  'suppliers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    name: text('name').notNull(),
    type: text('type', { enum: supplierTypeEnum }).notNull().default('other'),
    contactInfo: text('contact_info'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('suppliers_org_idx').on(table.orgId)]
)

export const purchaseStatusEnum = [
  'planning',
  'submitted',
  'received_jp',
  'completed',
  'cancelled',
] as const
export type PurchaseStatus = (typeof purchaseStatusEnum)[number]

export const purchases = pgTable(
  'purchases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    batchLabel: text('batch_label').notNull(),
    supplierId: uuid('supplier_id').references(() => suppliers.id),
    status: text('status', { enum: purchaseStatusEnum }).notNull().default('planning'),
    expectedJpyTotal: integer('expected_jpy_total').notNull().default(0),
    actualJpyTotal: integer('actual_jpy_total'),
    notes: text('notes'),
    createdById: uuid('created_by_id').references(() => adminUsers.id),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    receivedAt: timestamp('received_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('purchases_org_idx').on(table.orgId),
    index('purchases_status_idx').on(table.status),
    index('purchases_batch_idx').on(table.batchLabel),
  ]
)

export const purchaseItems = pgTable(
  'purchase_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    purchaseId: uuid('purchase_id').notNull().references(() => purchases.id, {
      onDelete: 'cascade',
    }),
    productId: uuid('product_id').references(() => products.id),
    productNameSnapshot: text('product_name_snapshot').notNull(),
    quantity: integer('quantity').notNull(),
    unitJpy: integer('unit_jpy').notNull(),
    actualUnitJpy: integer('actual_unit_jpy'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('purchase_items_purchase_idx').on(table.purchaseId)]
)

export type Supplier = typeof suppliers.$inferSelect
export type NewSupplier = typeof suppliers.$inferInsert
export type Purchase = typeof purchases.$inferSelect
export type NewPurchase = typeof purchases.$inferInsert
export type PurchaseItem = typeof purchaseItems.$inferSelect
export type NewPurchaseItem = typeof purchaseItems.$inferInsert
