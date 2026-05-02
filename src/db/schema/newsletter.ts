import { pgTable, uuid, text, timestamp, index, boolean } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const newsletterSubscribers = pgTable(
  'newsletter_subscribers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    email: text('email').notNull(),
    source: text('source'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
  },
  (table) => [
    index('newsletter_org_idx').on(table.orgId),
    index('newsletter_email_idx').on(table.email),
  ]
)

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect
