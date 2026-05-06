import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  index,
} from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const vendorTypeEnum = ['platform', 'brand', 'chain', 'resale', 'other'] as const
export const vendorStatusEnum = ['active', 'paused', 'dropped'] as const

export const sources = pgTable(
  'sources',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),

    // Tier 1
    name: text('name').notNull(),
    /** SKU 編號用簡碼，例如 NSW / NSE / SC */
    code: text('code'),
    url: text('url').notNull(),
    type: text('type', { enum: vendorTypeEnum }).notNull().default('other'),
    strengths: text('strengths'),
    status: text('status', { enum: vendorStatusEnum }).notNull().default('active'),

    // Tier 2
    rating: integer('rating'), // 1–5
    categories: text('categories').array(),
    paymentMethods: text('payment_methods').array(),
    needsMembership: boolean('needs_membership').notNull().default(false),
    shipsOverseas: boolean('ships_overseas').notNull().default(false),
    notes: text('notes'),

    // Tier 3
    lastOrderedAt: timestamp('last_ordered_at', { withTimezone: true }),
    avgProcessingDays: integer('avg_processing_days'),
    avgOrderJpy: integer('avg_order_jpy'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('sources_org_idx').on(table.orgId),
    index('sources_status_idx').on(table.status),
  ]
)

export type Source = typeof sources.$inferSelect
export type NewSource = typeof sources.$inferInsert
export type SourceType = (typeof vendorTypeEnum)[number]
export type SourceStatus = (typeof vendorStatusEnum)[number]
