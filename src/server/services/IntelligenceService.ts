import 'server-only'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  rawPosts,
  cleanedData,
  trends,
  competitors,
  intelligenceReports,
  type Trend,
  type Competitor,
  type IntelligenceReport,
} from '@/db/schema/intelligence'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

export interface IntelligenceOverview {
  rawPostCount: number
  cleanedCount: number
  trendCount: number
  competitorCount: number
  reportCount: number
  latestReport: IntelligenceReport | null
}

export async function getIntelligenceOverview(): Promise<IntelligenceOverview> {
  const [counts, latest] = await Promise.all([
    Promise.all([
      db
        .select({ c: sql<number>`count(*)::int` })
        .from(rawPosts)
        .where(eq(rawPosts.orgId, DEFAULT_ORG_ID)),
      db
        .select({ c: sql<number>`count(*)::int` })
        .from(cleanedData)
        .where(eq(cleanedData.orgId, DEFAULT_ORG_ID)),
      db
        .select({ c: sql<number>`count(*)::int` })
        .from(trends)
        .where(eq(trends.orgId, DEFAULT_ORG_ID)),
      db
        .select({ c: sql<number>`count(*)::int` })
        .from(competitors)
        .where(eq(competitors.orgId, DEFAULT_ORG_ID)),
      db
        .select({ c: sql<number>`count(*)::int` })
        .from(intelligenceReports)
        .where(eq(intelligenceReports.orgId, DEFAULT_ORG_ID)),
    ]),
    db
      .select()
      .from(intelligenceReports)
      .where(eq(intelligenceReports.orgId, DEFAULT_ORG_ID))
      .orderBy(desc(intelligenceReports.generatedAt))
      .limit(1),
  ])

  return {
    rawPostCount: counts[0][0]?.c ?? 0,
    cleanedCount: counts[1][0]?.c ?? 0,
    trendCount: counts[2][0]?.c ?? 0,
    competitorCount: counts[3][0]?.c ?? 0,
    reportCount: counts[4][0]?.c ?? 0,
    latestReport: latest[0] ?? null,
  }
}

export async function listTopTrends(limit = 20): Promise<Trend[]> {
  return db
    .select()
    .from(trends)
    .where(eq(trends.orgId, DEFAULT_ORG_ID))
    .orderBy(desc(trends.changePct), desc(trends.mentionCount))
    .limit(limit)
}

export async function listCompetitors(): Promise<Competitor[]> {
  return db
    .select()
    .from(competitors)
    .where(eq(competitors.orgId, DEFAULT_ORG_ID))
    .orderBy(asc(competitors.name))
}

export async function listReports(): Promise<IntelligenceReport[]> {
  return db
    .select()
    .from(intelligenceReports)
    .where(eq(intelligenceReports.orgId, DEFAULT_ORG_ID))
    .orderBy(desc(intelligenceReports.generatedAt))
}

export async function createCompetitor(input: {
  name: string
  platforms?: Competitor['platforms']
  monitoredKeywords?: string[] | null
  notes?: string | null
}): Promise<Competitor> {
  const [row] = await db
    .insert(competitors)
    .values({
      orgId: DEFAULT_ORG_ID,
      name: input.name,
      platforms: input.platforms ?? null,
      monitoredKeywords: input.monitoredKeywords ?? null,
      notes: input.notes ?? null,
    })
    .returning()
  return row
}

export interface PipelineStatus {
  scrapers: { source: string; lastRun: Date | null; recentCount: number }[]
}

export async function getPipelineStatus(): Promise<PipelineStatus> {
  const sources = ['ptt', 'dcard', 'shopee', 'google_trends', 'rakuten_jp', 'instagram', 'threads']
  const stats = await Promise.all(
    sources.map(async (source) => {
      const rows = await db
        .select({
          last: sql<Date | null>`max(${rawPosts.fetchedAt})`,
          count: sql<number>`count(*) filter (where ${rawPosts.fetchedAt} > now() - interval '7 days')::int`,
        })
        .from(rawPosts)
        .where(
          and(
            eq(rawPosts.orgId, DEFAULT_ORG_ID),
            eq(rawPosts.source, source as 'ptt')
          )
        )
      return {
        source,
        lastRun: rows[0]?.last ?? null,
        recentCount: rows[0]?.count ?? 0,
      }
    })
  )
  return { scrapers: stats }
}
