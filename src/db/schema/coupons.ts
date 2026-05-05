import { pgTable, uuid, text, integer, timestamp, boolean, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const couponTypeEnum = ['fixed', 'percent', 'free_shipping', 'tiered'] as const
export type CouponType = (typeof couponTypeEnum)[number]

export const couponAutoIssueEnum = [
  'manual',
  'signup',
  'birthday',
  'restock_filled',
  'referral_complete',
] as const
export type CouponAutoIssue = (typeof couponAutoIssueEnum)[number]

export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    code: text('code').notNull(),
    type: text('type', { enum: couponTypeEnum }).notNull(),
    value: integer('value').notNull(),
    description: text('description'),
    minOrderTwd: integer('min_order_twd').notNull().default(0),
    maxUses: integer('max_uses'),
    perUserLimit: integer('per_user_limit'),
    usedCount: integer('used_count').notNull().default(0),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    applicableProductIds: uuid('applicable_product_ids').array(),
    applicableCategorySlugs: text('applicable_category_slugs').array(),
    autoIssueOn: text('auto_issue_on', { enum: couponAutoIssueEnum }).notNull().default('manual'),
    isActive: boolean('is_active').notNull().default(true),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('coupons_org_idx').on(table.orgId),
    index('coupons_code_idx').on(table.code),
    index('coupons_auto_issue_idx').on(table.autoIssueOn),
  ]
)

export type Coupon = typeof coupons.$inferSelect
export type NewCoupon = typeof coupons.$inferInsert
