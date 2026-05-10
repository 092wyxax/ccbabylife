import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { adminUsers } from './admin_users'

export const rhythmRoleEnum = ['content', 'system', 'sourcing'] as const
export type RhythmRole = (typeof rhythmRoleEnum)[number]

export const rhythmCadenceEnum = ['daily', 'weekly'] as const
export type RhythmCadence = (typeof rhythmCadenceEnum)[number]

/**
 * Per-team weekly tasks. Hardcoded constants previously; now editable via
 * /admin/rhythm-tasks. Soft-delete via isActive=false so historical
 * completions stay queryable.
 */
export const rhythmTasks = pgTable(
  'rhythm_tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id),
    role: text('role', { enum: rhythmRoleEnum }).notNull(),
    cadence: text('cadence', { enum: rhythmCadenceEnum }).notNull(),
    /** ISO weekday 1=Mon … 7=Sun. Required when cadence='weekly'. */
    weekday: integer('weekday'),
    sort: integer('sort').notNull().default(0),
    label: text('label').notNull(),
    hint: text('hint'),
    timeHint: text('time_hint'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('rhythm_tasks_org_role_idx').on(t.orgId, t.role, t.isActive),
  ]
)

export type RhythmTask = typeof rhythmTasks.$inferSelect
export type NewRhythmTask = typeof rhythmTasks.$inferInsert

/**
 * Per-period completion log.
 *
 * `periodStart`:
 *   - daily tasks → that day's date (YYYY-MM-DD)
 *   - weekly tasks → the ISO Monday of that week (YYYY-MM-DD)
 *
 * Unique on (adminId, taskId, periodStart) so toggling is idempotent.
 */
export const rhythmCompletions = pgTable(
  'rhythm_completions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id),
    adminId: uuid('admin_id')
      .notNull()
      .references(() => adminUsers.id),
    taskId: uuid('task_id')
      .notNull()
      .references(() => rhythmTasks.id, { onDelete: 'cascade' }),
    periodStart: date('period_start').notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('rhythm_unique_idx').on(t.adminId, t.taskId, t.periodStart),
    index('rhythm_period_idx').on(t.orgId, t.periodStart),
  ]
)

export type RhythmCompletion = typeof rhythmCompletions.$inferSelect
export type NewRhythmCompletion = typeof rhythmCompletions.$inferInsert
