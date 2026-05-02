import { pgTable, uuid, text, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const sourceTypeEnum = [
  'ptt',
  'dcard',
  'shopee',
  'google_trends',
  'rakuten_jp',
  'instagram',
  'threads',
  'manual',
] as const

export const rawPosts = pgTable(
  'raw_posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    source: text('source', { enum: sourceTypeEnum }).notNull(),
    sourceUrl: text('source_url'),
    rawContent: text('raw_content').notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (table) => [
    index('raw_posts_org_idx').on(table.orgId),
    index('raw_posts_source_idx').on(table.source),
    index('raw_posts_fetched_idx').on(table.fetchedAt),
  ]
)

export const sentimentEnum = ['positive', 'neutral', 'negative'] as const

export const cleanedData = pgTable(
  'cleaned_data',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    rawPostId: uuid('raw_post_id').references(() => rawPosts.id, { onDelete: 'cascade' }),
    source: text('source', { enum: sourceTypeEnum }).notNull(),
    title: text('title'),
    content: text('content').notNull(),
    mentionedProducts: text('mentioned_products').array(),
    sentiment: text('sentiment', { enum: sentimentEnum }),
    tags: text('tags').array(),
    embeddingHint: text('embedding_hint'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('cleaned_data_org_idx').on(table.orgId),
    index('cleaned_data_source_idx').on(table.source),
  ]
)

export const trendPeriodEnum = ['daily', 'weekly'] as const

export const trends = pgTable(
  'trends',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    period: text('period', { enum: trendPeriodEnum }).notNull(),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    keyword: text('keyword').notNull(),
    source: text('source', { enum: sourceTypeEnum }),
    mentionCount: integer('mention_count').notNull().default(0),
    sentimentAvg: integer('sentiment_avg'),
    changePct: integer('change_pct'),
    relatedProductIds: uuid('related_product_ids').array(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('trends_org_idx').on(table.orgId),
    index('trends_period_idx').on(table.periodStart),
    index('trends_keyword_idx').on(table.keyword),
  ]
)

export const competitors = pgTable(
  'competitors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    name: text('name').notNull(),
    platforms: jsonb('platforms').$type<{
      ig?: string
      shopee?: string
      website?: string
    }>(),
    monitoredKeywords: text('monitored_keywords').array(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('competitors_org_idx').on(table.orgId)]
)

export const intelligenceReports = pgTable(
  'intelligence_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    summary: text('summary').notNull(),
    recommendations: jsonb('recommendations').$type<
      Array<{ kind: 'rising' | 'falling' | 'competitor' | 'stock'; text: string; meta?: object }>
    >(),
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('intelligence_reports_period_idx').on(table.periodStart)]
)

export type RawPost = typeof rawPosts.$inferSelect
export type CleanedData = typeof cleanedData.$inferSelect
export type Trend = typeof trends.$inferSelect
export type Competitor = typeof competitors.$inferSelect
export type IntelligenceReport = typeof intelligenceReports.$inferSelect
