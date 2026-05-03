import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const trendingAvailabilityEnum = ['in_stock', 'preorder', 'restricted'] as const
export const trendingSourceEnum = [
  'rakuten_jp',
  'amazon_jp',
  '@cosme',
  'mercari',
  'manual',
] as const

export const trendingProducts = pgTable(
  'trending_products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id),
    /** Monday 00:00 UTC of the week this snapshot represents. */
    weekStartedAt: timestamp('week_started_at', { withTimezone: true }).notNull(),
    rank: integer('rank').notNull(),
    source: text('source', { enum: trendingSourceEnum }).notNull(),
    sourceUrl: text('source_url'),
    nameJp: text('name_jp').notNull(),
    nameZh: text('name_zh').notNull(),
    priceJpy: integer('price_jpy'),
    imageUrl: text('image_url'),
    category: text('category'),
    /** matched against products.slug if we already carry this item */
    ourProductSlug: text('our_product_slug'),
    availability: text('availability', { enum: trendingAvailabilityEnum }).notNull(),
    /** Reason text for `restricted` items (e.g. "依嬰兒配方查驗登記辦法不販售") */
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('trending_org_week_idx').on(table.orgId, table.weekStartedAt),
    index('trending_rank_idx').on(table.weekStartedAt, table.rank),
  ]
)

export type TrendingProduct = typeof trendingProducts.$inferSelect
export type NewTrendingProduct = typeof trendingProducts.$inferInsert
