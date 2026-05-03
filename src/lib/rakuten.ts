import 'server-only'

/**
 * Rakuten Ichiba Ranking API client.
 *
 * Requires RAKUTEN_APP_ID env var. Register a free app at:
 *   https://webservice.rakuten.co.jp/
 *
 * If unset, callers fall back to manual import or skip the cron run.
 *
 * Genre IDs we monitor (drilled from genres > 母嬰 > sub-cat):
 *   100533  ベビー・キッズ・マタニティ（母嬰大類）
 *   562637    ベビーフード（嬰兒食品 — 大量會 hit restricted）
 *   100939    ベビー食器・お食事用品
 *   100804    哺乳びん・授乳用品
 *   200162    紙おむつ
 *   215749  ペット・ペットグッズ（寵物大類）
 */

export interface RakutenRankItem {
  rank: number
  itemName: string
  itemPrice: number
  itemCode: string
  itemUrl: string
  imageUrl: string | null
  shopName: string
  reviewCount: number
  reviewAverage: number
  genreId: number
}

interface RakutenResponseItem {
  Item: {
    rank: number
    itemName: string
    itemPrice: number
    itemCode: string
    itemUrl: string
    mediumImageUrls?: Array<{ imageUrl: string }>
    shopName: string
    reviewCount?: number
    reviewAverage?: number
    genreId?: string | number
  }
}

interface RakutenResponse {
  Items?: RakutenResponseItem[]
  error?: string
  error_description?: string
}

const ENDPOINT = 'https://app.rakuten.co.jp/services/api/IchibaItem/Ranking/20220601'

export const RAKUTEN_GENRES = [
  { id: 100533, label: 'ベビー・キッズ' },
  { id: 215749, label: 'ペット・ペットグッズ' },
] as const

export function isRakutenConfigured(): boolean {
  return Boolean(process.env.RAKUTEN_APP_ID)
}

export async function fetchGenreRanking(
  genreId: number,
  limit = 30
): Promise<RakutenRankItem[]> {
  const appId = process.env.RAKUTEN_APP_ID
  if (!appId) throw new Error('RAKUTEN_APP_ID not configured')

  const url = new URL(ENDPOINT)
  url.searchParams.set('applicationId', appId)
  url.searchParams.set('genreId', String(genreId))
  url.searchParams.set('format', 'json')
  url.searchParams.set('hits', String(Math.min(limit, 30)))
  url.searchParams.set('elements', 'rank,itemName,itemPrice,itemCode,itemUrl,mediumImageUrls,shopName,reviewCount,reviewAverage,genreId')

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Rakuten API ${res.status}: ${await res.text()}`)
  }
  const json = (await res.json()) as RakutenResponse
  if (json.error) {
    throw new Error(`Rakuten API error: ${json.error}: ${json.error_description}`)
  }
  if (!json.Items) return []

  return json.Items.map(({ Item }) => ({
    rank: Item.rank,
    itemName: Item.itemName,
    itemPrice: Item.itemPrice,
    itemCode: Item.itemCode,
    itemUrl: Item.itemUrl,
    imageUrl: Item.mediumImageUrls?.[0]?.imageUrl ?? null,
    shopName: Item.shopName,
    reviewCount: Item.reviewCount ?? 0,
    reviewAverage: Item.reviewAverage ?? 0,
    genreId: Number(Item.genreId ?? genreId),
  }))
}
