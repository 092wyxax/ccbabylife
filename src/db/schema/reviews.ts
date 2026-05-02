import { pgTable, uuid, text, integer, timestamp, boolean, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { customers } from './customers'
import { products } from './products'

export const reviewStatusEnum = ['pending', 'approved', 'rejected'] as const

export const productReviews = pgTable(
  'product_reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    rating: integer('rating').notNull(),
    title: text('title'),
    body: text('body').notNull(),
    status: text('status', { enum: reviewStatusEnum }).notNull().default('pending'),
    isVerifiedBuyer: boolean('is_verified_buyer').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('reviews_product_idx').on(table.productId),
    index('reviews_status_idx').on(table.status),
  ]
)

export type ProductReview = typeof productReviews.$inferSelect
