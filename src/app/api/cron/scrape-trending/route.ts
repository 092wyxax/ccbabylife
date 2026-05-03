import { NextRequest, NextResponse } from 'next/server'
import {
  refreshTrending,
  pruneOldSnapshots,
} from '@/server/services/TrendingService'

/**
 * Weekly: scrape Rakuten ranking + Anthropic translate + write trending_products.
 *
 * Vercel cron schedule (vercel.json): "0 20 * * 3" — Wednesday 20:00 UTC = Thursday 04:00 JST.
 * Aligns with the homepage "本週更新" cadence customers expect.
 *
 * Secured by CRON_SECRET. Manual trigger:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://your-site/api/cron/scrape-trending
 *
 * This route can take 30–60 seconds because each item triggers an Anthropic
 * call. Vercel Hobby has a 60s function timeout — if you hit it, lower
 * `totalLimit` or move to a Worker.
 */
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    auth !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const result = await refreshTrending({ perGenre: 15, totalLimit: 20 })
  const pruned = await pruneOldSnapshots(8)

  return NextResponse.json({
    weekStartedAt: result.weekStartedAt.toISOString(),
    fetched: result.fetched,
    inserted: result.inserted,
    prunedOldRows: pruned,
    errors: result.errors,
    timestamp: new Date().toISOString(),
  })
}
