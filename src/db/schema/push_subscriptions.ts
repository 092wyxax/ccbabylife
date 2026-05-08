import { pgTable, uuid, text, timestamp, index, unique } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { customers } from './customers'

/**
 * Web Push subscriptions per customer device. Multiple per customer allowed
 * (phone + laptop). Endpoint is unique across the whole table.
 */
export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
    /** From PushSubscription.endpoint */
    endpoint: text('endpoint').notNull(),
    /** From PushSubscription.toJSON().keys.p256dh */
    p256dhKey: text('p256dh_key').notNull(),
    /** From PushSubscription.toJSON().keys.auth */
    authKey: text('auth_key').notNull(),
    /** Optional UA hint for admin debug */
    userAgent: text('user_agent'),
    lastSentAt: timestamp('last_sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('push_sub_customer_idx').on(table.customerId),
    unique('push_sub_endpoint_unique').on(table.endpoint),
  ]
)

export type PushSubscription = typeof pushSubscriptions.$inferSelect
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert
