import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { adminUsers } from './admin_users'

export const announcements = pgTable(
  'announcements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    authorId: uuid('author_id').notNull().references(() => adminUsers.id),
    title: text('title').notNull(),
    body: text('body').notNull(),
    isPinned: boolean('is_pinned').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('announcements_org_idx').on(table.orgId),
    index('announcements_pinned_idx').on(table.isPinned),
  ]
)

export const announcementComments = pgTable(
  'announcement_comments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    announcementId: uuid('announcement_id')
      .notNull()
      .references(() => announcements.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id').notNull().references(() => adminUsers.id),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('announcement_comments_announcement_idx').on(table.announcementId),
  ]
)

export const announcementReads = pgTable(
  'announcement_reads',
  {
    announcementId: uuid('announcement_id')
      .notNull()
      .references(() => announcements.id, { onDelete: 'cascade' }),
    adminId: uuid('admin_id').notNull().references(() => adminUsers.id),
    readAt: timestamp('read_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.announcementId, table.adminId] }),
    index('announcement_reads_admin_idx').on(table.adminId),
  ]
)

export type Announcement = typeof announcements.$inferSelect
export type AnnouncementComment = typeof announcementComments.$inferSelect
export type AnnouncementRead = typeof announcementReads.$inferSelect
