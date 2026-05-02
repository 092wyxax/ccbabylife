import { pgTable, uuid, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const auditActorTypeEnum = ['admin', 'customer', 'system'] as const
export type AuditActorType = (typeof auditActorTypeEnum)[number]

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    actorType: text('actor_type', { enum: auditActorTypeEnum }).notNull(),
    actorId: uuid('actor_id'),
    actorLabel: text('actor_label'),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id'),
    data: jsonb('data').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('audit_logs_org_idx').on(table.orgId),
    index('audit_logs_action_idx').on(table.action),
    index('audit_logs_entity_idx').on(table.entityType, table.entityId),
    index('audit_logs_created_idx').on(table.createdAt),
  ]
)

export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert
