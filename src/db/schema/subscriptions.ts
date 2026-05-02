import { pgTable, uuid, text, integer, timestamp, index, jsonb } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { customers } from './customers'

export const subscriptionStatusEnum = ['active', 'paused', 'cancelled'] as const
export const subscriptionFreqEnum = ['monthly', 'bimonthly', 'quarterly'] as const

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
    status: text('status', { enum: subscriptionStatusEnum }).notNull().default('active'),
    frequency: text('frequency', { enum: subscriptionFreqEnum }).notNull(),
    /** Lines: [{ productId, quantity }] */
    lines: jsonb('lines').$type<Array<{ productId: string; quantity: number }>>().notNull(),
    nextRunAt: timestamp('next_run_at', { withTimezone: true }).notNull(),
    lastRunAt: timestamp('last_run_at', { withTimezone: true }),
    runCount: integer('run_count').notNull().default(0),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('subs_customer_idx').on(table.customerId),
    index('subs_next_run_idx').on(table.nextRunAt),
  ]
)

export type Subscription = typeof subscriptions.$inferSelect
