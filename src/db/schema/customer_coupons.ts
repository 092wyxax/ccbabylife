import { pgTable, uuid, timestamp, index, unique } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { customers } from './customers'
import { coupons } from './coupons'

export const customerCoupons = pgTable(
  'customer_coupons',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
    couponId: uuid('coupon_id').notNull().references(() => coupons.id, { onDelete: 'cascade' }),
    claimedAt: timestamp('claimed_at', { withTimezone: true }).notNull().defaultNow(),
    usedAt: timestamp('used_at', { withTimezone: true }),
  },
  (table) => [
    index('cust_coupons_customer_idx').on(table.customerId),
    unique('cust_coupons_unique').on(table.customerId, table.couponId),
  ]
)

export type CustomerCoupon = typeof customerCoupons.$inferSelect
