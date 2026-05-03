import 'server-only'
import { and, desc, eq, ilike, lt } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  trendingProducts,
  type TrendingProduct,
} from '@/db/schema/trending_products'
import { products } from '@/db/schema/products'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import {
  fetchGenreRanking,
  isRakutenConfigured,
  RAKUTEN_GENRES,
  type RakutenRankItem,
} from '@/lib/rakuten'
import {
  classifyProduct,
  isAnthropicConfigured,
} from '@/lib/anthropic-classify'

/**
 * Latest snapshot's weekStartedAt, or null if table is empty.
 */
export async function getLatestWeek(): Promise<Date | null> {
  const [row] = await db
    .select({ weekStartedAt: trendingProducts.weekStartedAt })
    .from(trendingProducts)
    .where(eq(trendingProducts.orgId, DEFAULT_ORG_ID))
    .orderBy(desc(trendingProducts.weekStartedAt))
    .limit(1)
  return row?.weekStartedAt ?? null
}

/**
 * Read this week's full ranking ordered by rank ascending.
 */
export async function listLatestTrending(limit = 30): Promise<TrendingProduct[]> {
  const week = await getLatestWeek()
  if (!week) return []
  return db
    .select()
    .from(trendingProducts)
    .where(
      and(
        eq(trendingProducts.orgId, DEFAULT_ORG_ID),
        eq(trendingProducts.weekStartedAt, week)
      )
    )
    .orderBy(trendingProducts.rank)
    .limit(limit)
}

/**
 * Compute Monday 00:00 UTC of the current week.
 */
export function currentWeekStart(): Date {
  const now = new Date()
  const day = now.getUTCDay() // 0 Sun, 1 Mon, ... 6 Sat
  const diffToMon = (day + 6) % 7
  const monday = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - diffToMon
    )
  )
  return monday
}

/**
 * Try to match a JP item name to one of our SKUs by fuzzy ILIKE on the
 * Japanese product name. Returns the product slug or null.
 */
async function matchOurProduct(itemName: string): Promise<string | null> {
  // Take the first three meaningful tokens from the JP name as a fingerprint.
  // Rakuten names often start with brand + product name + size.
  const tokens = itemName
    .replace(/【[^】]*】|\[[^\]]*\]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .slice(0, 2)

  for (const token of tokens) {
    const [hit] = await db
      .select({ slug: products.slug })
      .from(products)
      .where(
        and(
          eq(products.orgId, DEFAULT_ORG_ID),
          eq(products.status, 'active'),
          ilike(products.nameJp, `%${token}%`)
        )
      )
      .limit(1)
    if (hit) return hit.slug
  }
  return null
}

interface BuildArgs {
  source: 'rakuten_jp'
  rakutenItem: RakutenRankItem
}

async function buildRow(
  weekStartedAt: Date,
  args: BuildArgs
): Promise<typeof trendingProducts.$inferInsert> {
  const r = args.rakutenItem

  const cls = await classifyProduct({
    itemName: r.itemName,
    shopName: r.shopName,
    priceJpy: r.itemPrice,
    itemUrl: r.itemUrl,
  })

  const ourSlug = await matchOurProduct(r.itemName)

  let availability: 'in_stock' | 'preorder' | 'restricted'
  if (cls.restricted) availability = 'restricted'
  else if (ourSlug) availability = 'in_stock'
  else availability = 'preorder'

  return {
    orgId: DEFAULT_ORG_ID,
    weekStartedAt,
    rank: r.rank,
    source: args.source,
    sourceUrl: r.itemUrl,
    nameJp: r.itemName.slice(0, 200),
    nameZh: cls.nameZh,
    priceJpy: r.itemPrice,
    imageUrl: r.imageUrl,
    category: cls.category,
    ourProductSlug: ourSlug,
    availability,
    note: cls.restrictedReason,
  }
}

export interface FetchSummary {
  weekStartedAt: Date
  fetched: number
  inserted: number
  errors: string[]
}

/**
 * Full pipeline: pull Rakuten rankings, classify with Claude, upsert into DB.
 * Idempotent per week — clears existing rows for the week first.
 *
 * If Rakuten or Anthropic is not configured, returns a summary with errors
 * and inserts nothing (does not throw).
 */
export async function refreshTrending(opts: {
  perGenre?: number
  totalLimit?: number
}): Promise<FetchSummary> {
  const errors: string[] = []
  const week = currentWeekStart()

  if (!isRakutenConfigured()) {
    errors.push('RAKUTEN_APP_ID not configured')
  }
  if (!isAnthropicConfigured()) {
    errors.push('ANTHROPIC_API_KEY not configured')
  }
  if (errors.length > 0) {
    return { weekStartedAt: week, fetched: 0, inserted: 0, errors }
  }

  const perGenre = opts.perGenre ?? 15
  const totalLimit = opts.totalLimit ?? 20

  // 1. Fetch all genres in parallel.
  const allItems: RakutenRankItem[] = []
  await Promise.all(
    RAKUTEN_GENRES.map(async ({ id, label }) => {
      try {
        const items = await fetchGenreRanking(id, perGenre)
        allItems.push(...items)
      } catch (e) {
        errors.push(
          `genre ${label} (${id}): ${e instanceof Error ? e.message : String(e)}`
        )
      }
    })
  )

  if (allItems.length === 0) {
    return { weekStartedAt: week, fetched: 0, inserted: 0, errors }
  }

  // 2. Sort by rank ascending across all genres, dedupe by itemCode.
  const seen = new Set<string>()
  const merged = allItems
    .sort((a, b) => a.rank - b.rank)
    .filter((it) => {
      if (seen.has(it.itemCode)) return false
      seen.add(it.itemCode)
      return true
    })
    .slice(0, totalLimit)
    // Re-rank 1..N after merging genres
    .map((it, i) => ({ ...it, rank: i + 1 }))

  // 3. Classify + match in series (cheap rate limiting against Anthropic).
  const rows: Array<typeof trendingProducts.$inferInsert> = []
  for (const r of merged) {
    try {
      const row = await buildRow(week, { source: 'rakuten_jp', rakutenItem: r })
      rows.push(row)
    } catch (e) {
      errors.push(
        `classify rank ${r.rank} (${r.itemCode}): ${e instanceof Error ? e.message : String(e)}`
      )
    }
  }

  if (rows.length === 0) {
    return { weekStartedAt: week, fetched: merged.length, inserted: 0, errors }
  }

  // 4. Replace this week's data atomically.
  await db.transaction(async (tx) => {
    await tx
      .delete(trendingProducts)
      .where(
        and(
          eq(trendingProducts.orgId, DEFAULT_ORG_ID),
          eq(trendingProducts.weekStartedAt, week)
        )
      )
    await tx.insert(trendingProducts).values(rows)
  })

  return {
    weekStartedAt: week,
    fetched: merged.length,
    inserted: rows.length,
    errors,
  }
}

/**
 * Garbage-collect snapshots older than `keepWeeks`.
 */
export async function pruneOldSnapshots(keepWeeks = 8): Promise<number> {
  const cutoff = new Date(Date.now() - keepWeeks * 7 * 24 * 60 * 60 * 1000)
  const deleted = await db
    .delete(trendingProducts)
    .where(
      and(
        eq(trendingProducts.orgId, DEFAULT_ORG_ID),
        lt(trendingProducts.weekStartedAt, cutoff)
      )
    )
    .returning({ id: trendingProducts.id })
  return deleted.length
}
