import { pgTable, uuid, text, integer, timestamp, boolean, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const couponTypeEnum = ['fixed', 'percent'] as const
export type CouponType = (typeof couponTypeEnum)[number]

export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    code: text('code').notNull(),
    type: text('type', { enum: couponTypeEnum }).notNull(),
    value: integer('value').notNull(),
    minOrderTwd: integer('min_order_twd').notNull().default(0),
    maxUses: integer('max_uses'),
    usedCount: integer('used_count').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('coupons_org_idx').on(table.orgId),
    index('coupons_code_idx').on(table.code),
  ]
)

export type Coupon = typeof coupons.$inferSelect
export type NewCoupon = typeof coupons.$inferInsert
