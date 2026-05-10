import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { adminUsers } from './admin_users'

/**
 * Per-period completion log for the Weekly Operating Rhythm.
 *
 * `taskId` references RHYTHM_TASKS in src/lib/weekly-rhythm.ts (string keys, not FK).
 * `periodStart`:
 *   - daily tasks → that day's date (YYYY-MM-DD)
 *   - weekly tasks → the ISO Monday of that week (YYYY-MM-DD)
 *
 * Unique on (adminId, taskId, periodStart) so the same admin marking the
 * same task in the same period is idempotent.
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
    taskId: text('task_id').notNull(),
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
