import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  plan: text('plan').notNull().default('owner'),
  billingStatus: text('billing_status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001'

export type Organization = typeof organizations.$inferSelect
export type NewOrganization = typeof organizations.$inferInsert
