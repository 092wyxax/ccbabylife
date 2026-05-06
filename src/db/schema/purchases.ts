import { pgTable, uuid, text, integer, timestamp, date, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { adminUsers } from './admin_users'
import { products, categories } from './products'
import { sources } from './sources'
import {
  taxRateGroups,
  clearanceFeePlans,
  agentServicePlans,
  paymentMethods,
} from './procurement_settings'

export const priceRoundStrategyEnum = ['A', 'B', 'C', 'D'] as const
export type PriceRoundStrategy = (typeof priceRoundStrategyEnum)[number]

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

    /* ───── Phase 2 finance integration fields ───── */
    sourceId: uuid('source_id').references(() => sources.id),
    purchaseDate: date('purchase_date'),
    /** 匯率 × 100000 (e.g. 0.21359 = 21359). 5 decimal precision. */
    exchangeRateScaled: integer('exchange_rate_scaled'),
    twdTotal: integer('twd_total'),
    agentPlanId: uuid('agent_plan_id').references(() => agentServicePlans.id),
    clearanceFeePlanId: uuid('clearance_fee_plan_id').references(() => clearanceFeePlans.id),
    packagingFeeTotal: integer('packaging_fee_total').notNull().default(0),
    paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id),
    /** 加成倍率 basis points × 100, default 3000 = 30% markup */
    markupRateBp: integer('markup_rate_bp').notNull().default(3000),
    priceRoundStrategy: text('price_round_strategy', { enum: priceRoundStrategyEnum })
      .notNull()
      .default('B'),
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

    /* ───── Phase 2 finance integration fields ───── */
    categoryId: uuid('category_id').references(() => categories.id),
    taxRateGroupId: uuid('tax_rate_group_id').references(() => taxRateGroups.id),
    nameZh: text('name_zh'),
    nameJp: text('name_jp'),
    spec: text('spec'),
    description: text('description'),
    /** Snapshots — calculated at save time, frozen for audit. All TWD integers. */
    jpySubtotal: integer('jpy_subtotal'),
    twdSubtotal: integer('twd_subtotal'),
    importDuty: integer('import_duty'),
    promoFee: integer('promo_fee'),
    vat: integer('vat'),
    clearanceFeeShare: integer('clearance_fee_share'),
    packagingFeeShare: integer('packaging_fee_share'),
    agentFeeShare: integer('agent_fee_share'),
    landedCostPerUnit: integer('landed_cost_per_unit'),
    suggestedPriceRaw: integer('suggested_price_raw'),
    suggestedPrice: integer('suggested_price'),

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
