import { pgTable, uuid, text, timestamp, boolean, index, unique } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { products } from './products'

export const restockSubscriptions = pgTable(
  'restock_subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    notified: boolean('notified').notNull().default(false),
    notifiedAt: timestamp('notified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('restock_product_idx').on(table.productId),
    unique('restock_unique').on(table.productId, table.email),
  ]
)

export type RestockSubscription = typeof restockSubscriptions.$inferSelect
