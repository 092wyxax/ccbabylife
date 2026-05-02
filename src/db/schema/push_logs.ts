import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { customers } from './customers'

export const pushChannelEnum = ['line', 'email'] as const
export const pushStatusEnum = ['queued', 'sent', 'failed'] as const

export const pushLogs = pgTable(
  'push_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    customerId: uuid('customer_id').references(() => customers.id),
    channel: text('channel', { enum: pushChannelEnum }).notNull(),
    status: text('status', { enum: pushStatusEnum }).notNull().default('queued'),
    templateId: text('template_id'),
    subject: text('subject'),
    body: text('body').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>(),
    error: text('error'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('push_logs_org_idx').on(table.orgId),
    index('push_logs_customer_idx').on(table.customerId),
    index('push_logs_status_idx').on(table.status),
    index('push_logs_created_idx').on(table.createdAt),
  ]
)

export type PushLog = typeof pushLogs.$inferSelect
export type NewPushLog = typeof pushLogs.$inferInsert
