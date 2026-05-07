import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
} from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { adminUsers } from './admin_users'

export const todoStatusEnum = ['open', 'done', 'cancelled'] as const
export type TodoStatus = (typeof todoStatusEnum)[number]

export const todoPriorityEnum = ['low', 'normal', 'high'] as const
export type TodoPriority = (typeof todoPriorityEnum)[number]

export const todos = pgTable(
  'todos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    title: text('title').notNull(),
    body: text('body'),
    dueAt: timestamp('due_at', { withTimezone: true }),
    status: text('status', { enum: todoStatusEnum }).notNull().default('open'),
    priority: text('priority', { enum: todoPriorityEnum }).notNull().default('normal'),
    /** null 代表共用（全店都看得到）；指定 admin = 個人代辦 */
    assigneeId: uuid('assignee_id').references(() => adminUsers.id),
    isShared: boolean('is_shared').notNull().default(false),
    createdById: uuid('created_by_id').notNull().references(() => adminUsers.id),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('todos_org_due_idx').on(t.orgId, t.dueAt),
    index('todos_assignee_status_idx').on(t.assigneeId, t.status),
  ]
)

export type Todo = typeof todos.$inferSelect
export type NewTodo = typeof todos.$inferInsert
