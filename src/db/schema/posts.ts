import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { adminUsers } from './admin_users'

export const postStatusEnum = ['draft', 'active', 'archived'] as const

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    excerpt: text('excerpt'),
    body: text('body').notNull(),
    heroImage: text('hero_image'),
    authorId: uuid('author_id').references(() => adminUsers.id),
    status: text('status', { enum: postStatusEnum }).notNull().default('draft'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('posts_org_idx').on(table.orgId),
    index('posts_slug_idx').on(table.slug),
    index('posts_status_idx').on(table.status),
  ]
)

export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
