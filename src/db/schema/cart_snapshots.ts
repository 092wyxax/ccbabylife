import { pgTable, uuid, text, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { customers } from './customers'

/**
 * Persists a customer's cart server-side so we can recover them via LINE/email
 * when they abandon checkout. Updated whenever the client cart changes for a
 * known customer/email. Removed (or marked recovered=true) on order placement.
 */
export const cartSnapshots = pgTable(
  'cart_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    /** Linked to a customer if logged in */
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
    /** Or a contactable email if not logged in (matched on checkout) */
    email: text('email'),
    /** JSON snapshot of CartItem[] at last update */
    items: jsonb('items').notNull(),
    itemCount: integer('item_count').notNull().default(0),
    subtotalTwd: integer('subtotal_twd').notNull().default(0),
    /** Last time the cart was modified (for "abandoned > X hours" cron) */
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    /** Set when we sent a recovery push */
    recoveryPushedAt: timestamp('recovery_pushed_at', { withTimezone: true }),
    /** Set when this cart was checked out (we keep the row for analytics) */
    recoveredAt: timestamp('recovered_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('cart_snapshots_customer_idx').on(table.customerId),
    index('cart_snapshots_email_idx').on(table.email),
    index('cart_snapshots_updated_idx').on(table.updatedAt),
  ]
)

export type CartSnapshot = typeof cartSnapshots.$inferSelect
export type NewCartSnapshot = typeof cartSnapshots.$inferInsert
