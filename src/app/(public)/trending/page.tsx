import Link from 'next/link'
import { TRENDING_PRODUCTS, type AvailabilityStatus } from '@/lib/japan-content'
import { formatJpy } from '@/lib/format'
import { listLatestTrending, getLatestWeek } from '@/server/services/TrendingService'

export const metadata = {
  title: '日本熱賣榜',
  description: '日本媽媽現在都在買什麼？每週爬樂天、Amazon JP、@cosme 熱銷榜，含「我們有」「可代購」「不販售（法規）」標記。',
}

const SOURCE_LABEL: Record<string, string> = {
  rakuten_jp: '楽天',
  amazon_jp: 'Amazon JP',
  '@cosme': '@cosme',
  mercari: 'Mercari',
}

interface DisplayItem {
  rank: number
  source: string
  nameJp: string
  nameZh: string
  priceJpy: number | null
  category: string | null
  availability: AvailabilityStatus
  ourProductSlug: string | null
  note: string | null
}

export default async function TrendingPage() {
  const dbWeek = await getLatestWeek()
  const dbItems = dbWeek ? await listLatestTrending(20) : []

  const items: DisplayItem[] =
    dbItems.length > 0
      ? dbItems.map((r) => ({
          rank: r.rank,
          source: r.source,
          nameJp: r.nameJp,
          nameZh: r.nameZh,
          priceJpy: r.priceJpy,
          category: r.category,
          availability: r.availability,
          ourProductSlug: r.ourProductSlug,
          note: r.note,
        }))
      : TRENDING_PRODUCTS.map((p) => ({
          rank: p.rank,
          source: p.source,
          nameJp: p.nameJp,
          nameZh: p.nameZh,
          priceJpy: p.priceJpy,
          category: p.category,
          availability: p.availability,
          ourProductSlug: p.ourProductSlug ?? null,
          note: p.note ?? null,
        }))

  const weekLabel = dbWeek
    ? new Date(dbWeek).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    : '示意資料'

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-3">
        TRENDING · 日本人気ランキング
      </p>
      <h1 className="font-serif text-3xl sm:text-4xl mb-3 tracking-wide">
        日本媽媽現在都在買什麼？
      </h1>
      <p className="text-ink-soft max-w-2xl leading-relaxed mb-2">
        每週爬樂天、Amazon JP、@cosme 母嬰熱銷榜。
        清楚標示「我們有」「可代購」與「依法規不販售」三類，
        讓你一眼看清楚日本當下趨勢。
      </p>
      <p className="font-jp text-xs text-ink-soft tracking-wider mb-10">
        本週更新 · {weekLabel}（每週四自動更新）
      </p>

      <ul className="space-y-3">
        {items.map((p) => (
          <li
            key={p.rank}
            className="bg-white border border-line rounded-lg p-5 flex items-start gap-5"
          >
            <span className="font-serif text-3xl text-accent/60 leading-none w-10 shrink-0">
              {String(p.rank).padStart(2, '0')}
            </span>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-base">{p.nameZh}</p>
              <p className="font-jp text-xs text-ink-soft mt-0.5 line-clamp-2">{p.nameJp}</p>

              <div className="flex flex-wrap items-baseline gap-3 mt-3 text-xs">
                {p.priceJpy != null && (
                  <span className="font-mono text-sm">{formatJpy(p.priceJpy)}</span>
                )}
                <span className="font-jp text-ink-soft tracking-wider">
                  {SOURCE_LABEL[p.source] ?? p.source}
                </span>
                {p.category && (
                  <>
                    <span className="text-ink-soft">·</span>
                    <span className="text-ink-soft">{p.category}</span>
                  </>
                )}
              </div>
            </div>

            <div className="shrink-0">
              <AvailabilityBadge
                status={p.availability}
                note={p.note ?? undefined}
                slug={p.ourProductSlug ?? undefined}
              />
            </div>
          </li>
        ))}
      </ul>

      <section className="mt-12 bg-cream-100 border border-line rounded-lg p-6 text-sm leading-relaxed">
        <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">
          ご注意 · 關於「不販售」品項
        </p>
        <p className="text-ink-soft">
          標示「不販售」的品項，依台灣《嬰兒配方食品查驗登記辦法》、
          《動物傳染病防治條例》等法規，本店一律不代購。
          詳細法規說明請見
          <Link href="/about" className="underline hover:text-accent ml-1">
            關於我們 · 法規誠信宣告
          </Link>
          。
        </p>
      </section>
    </div>
  )
}

function AvailabilityBadge({
  status,
  note,
  slug,
}: {
  status: AvailabilityStatus
  note?: string
  slug?: string
}) {
  if (status === 'in_stock' && slug) {
    return (
      <Link
        href={`/shop/${slug}`}
        className="font-jp inline-block bg-success/15 hover:bg-success hover:text-white text-ink text-xs px-3 py-1.5 rounded-md tracking-wider transition-colors whitespace-nowrap"
      >
        ✓ 在庫あり · 我們有
      </Link>
    )
  }
  if (status === 'preorder') {
    return (
      <span className="font-jp inline-block bg-warning/20 text-ink text-xs px-3 py-1.5 rounded-md tracking-wider whitespace-nowrap">
        📦 予約可能 · 可代購
      </span>
    )
  }
  return (
    <div className="text-right max-w-[160px]">
      <span className="font-jp inline-block bg-danger/15 text-danger text-xs px-3 py-1.5 rounded-md tracking-wider whitespace-nowrap">
        ⚠ 取扱不可 · 不販售
      </span>
      {note && (
        <p className="text-[10px] text-ink-soft mt-1.5 leading-tight">{note}</p>
      )}
    </div>
  )
}
