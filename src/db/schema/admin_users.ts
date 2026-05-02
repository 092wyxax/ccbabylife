import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const adminRoleEnum = ['owner', 'admin', 'partner'] as const
export type AdminRole = (typeof adminRoleEnum)[number]

export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    supabaseUserId: uuid('supabase_user_id').notNull().unique(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    role: text('role', { enum: adminRoleEnum }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('admin_users_org_idx').on(table.orgId)]
)

export type AdminUser = typeof adminUsers.$inferSelect
export type NewAdminUser = typeof adminUsers.$inferInsert
