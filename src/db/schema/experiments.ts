import { pgTable, uuid, text, integer, timestamp, jsonb, index, boolean } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const experimentStatusEnum = ['draft', 'running', 'paused', 'completed'] as const

export const experiments = pgTable(
  'experiments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    key: text('key').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    status: text('status', { enum: experimentStatusEnum }).notNull().default('draft'),
    /** Variants as JSON: [{ key: 'A', label: 'Control', weight: 50 }, ...] */
    variants: jsonb('variants').$type<Array<{ key: string; label: string; weight: number }>>().notNull(),
    isActive: boolean('is_active').notNull().default(false),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('experiments_org_idx').on(table.orgId),
    index('experiments_key_idx').on(table.key),
  ]
)

export const experimentExposures = pgTable(
  'experiment_exposures',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    experimentKey: text('experiment_key').notNull(),
    variantKey: text('variant_key').notNull(),
    visitorId: text('visitor_id').notNull(),
    /** Event counter — exposures, conversions etc */
    eventType: text('event_type').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('exp_exposures_exp_idx').on(table.experimentKey, table.variantKey),
    index('exp_exposures_visitor_idx').on(table.visitorId),
  ]
)

export type Experiment = typeof experiments.$inferSelect
export type ExperimentExposure = typeof experimentExposures.$inferSelect
