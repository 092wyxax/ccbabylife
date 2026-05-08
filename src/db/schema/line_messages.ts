import { pgTable, uuid, text, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

/**
 * LINE OA inbox — every inbound message from a follower lands here, plus
 * outbound replies the admin sends. One row per message.
 */
export const lineMessageDirectionEnum = ['in', 'out'] as const
export type LineMessageDirection = (typeof lineMessageDirectionEnum)[number]

export const lineMessages = pgTable(
  'line_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    /** LINE userId of the OA follower (the customer / lead) */
    lineUserId: text('line_user_id').notNull(),
    direction: text('direction', { enum: lineMessageDirectionEnum }).notNull(),
    /** Inbound LINE messageId (for de-dup); null for outbound */
    lineMessageId: text('line_message_id').unique(),
    /** 'text' for now; LINE supports image / sticker / etc. */
    type: text('type').notNull().default('text'),
    text: text('text'),
    /** Raw event payload from LINE for debugging */
    raw: jsonb('raw'),
    /** Has admin marked this thread as read? */
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('line_msg_user_idx').on(table.lineUserId, table.createdAt),
    index('line_msg_unread_idx').on(table.isRead, table.createdAt),
  ]
)

export type LineMessage = typeof lineMessages.$inferSelect
export type NewLineMessage = typeof lineMessages.$inferInsert
