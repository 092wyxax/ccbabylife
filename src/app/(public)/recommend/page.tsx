import Link from 'next/link'
import { listProductsByAge } from '@/server/services/ProductService'
import { ProductGrid } from '@/components/shop/ProductGrid'

export const metadata = {
  title: '寶寶月齡選物器',
  description: '輸入寶寶月齡，自動推薦適合的日系選物。',
}

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ months?: string }>
}

const QUICK_AGES = [
  { months: 0, label: '新生兒', sub: '0 個月' },
  { months: 3, label: '3 個月', sub: '抓握 / 翻身' },
  { months: 6, label: '6 個月', sub: '副食品入門' },
  { months: 9, label: '9 個月', sub: '會爬 / 站' },
  { months: 12, label: '1 歲', sub: '邁開腳步' },
  { months: 18, label: '1.5 歲', sub: '會跑 / 自己吃' },
  { months: 24, label: '2 歲', sub: '社交 / 模仿' },
  { months: 36, label: '3 歲', sub: '幼稚園準備' },
]

export default async function RecommendPage({ searchParams }: Props) {
  const { months: monthsParam } = await searchParams
  const months = monthsParam != null ? Number(monthsParam) : null

  let buckets: Awaited<ReturnType<typeof listProductsByAge>> | null = null
  if (months != null && !isNaN(months) && months >= 0 && months <= 240) {
    try {
      buckets = await listProductsByAge(months)
    } catch {
      buckets = null
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-16">
      <header className="text-center mb-10">
        <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">
          RECOMMEND · 月齢で選ぶ
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl tracking-wide mb-3">
          寶寶月齡選物器
        </h1>
        <p className="text-ink-soft text-sm sm:text-base leading-relaxed max-w-md mx-auto">
          告訴我們寶寶幾個月，我們從日本選物清單中挑出
          <strong className="text-ink"> 現在能用 </strong>
          +
          <strong className="text-ink"> 接下來 3 個月會用到 </strong>
          的好物。
        </p>
      </header>

      {/* Quick age buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {QUICK_AGES.map((a) => (
          <Link
            key={a.months}
            href={`/recommend?months=${a.months}`}
            className={
              'block p-4 rounded-lg border-2 transition-colors text-center ' +
              (months === a.months
                ? 'bg-seal text-cream border-seal'
                : 'bg-white border-line hover:border-ink')
            }
          >
            <p className="font-serif text-lg">{a.label}</p>
            <p className={'text-xs mt-1 ' + (months === a.months ? 'text-cream/80' : 'text-ink-soft')}>
              {a.sub}
            </p>
          </Link>
        ))}
      </div>

      {/* Manual input */}
      <form action="/recommend" method="get" className="text-center mb-12">
        <label className="text-sm text-ink-soft mr-3">
          其他月齡：
        </label>
        <input
          type="number"
          name="months"
          min="0"
          max="240"
          defaultValue={monthsParam ?? ''}
          placeholder="輸入數字"
          className="w-24 border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-ink"
        />
        <span className="text-sm text-ink-soft ml-1 mr-3">個月</span>
        <button
          type="submit"
          className="font-jp bg-ink text-cream text-sm px-4 py-2 rounded-md hover:bg-accent tracking-wider"
        >
          查詢
        </button>
      </form>

      {/* Results */}
      {months == null ? (
        <div className="bg-cream-100 border border-dashed border-line rounded-lg p-10 text-center text-ink-soft text-sm">
          選一個月齡開始 ↑
        </div>
      ) : !buckets ||
        (buckets.fits.length === 0 && buckets.soon.length === 0) ? (
        <div className="bg-cream-100 border border-dashed border-line rounded-lg p-10 text-center">
          <p className="text-ink-soft mb-4">
            目前 {months} 個月寶寶適用的商品還在補齊中
          </p>
          <Link href="/shop" className="text-accent hover:underline text-sm">
            看所有選物 →
          </Link>
        </div>
      ) : (
        <>
          {buckets.fits.length > 0 && (
            <section className="mb-12">
              <header className="mb-4">
                <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-1">
                  NOW · 現在就能用
                </p>
                <h2 className="font-serif text-xl tracking-wide">{months} 個月寶寶適用</h2>
              </header>
              <ProductGrid products={buckets.fits} />
            </section>
          )}

          {buckets.soon.length > 0 && (
            <section className="mb-12">
              <header className="mb-4">
                <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-1">
                  SOON · 接下來 3 個月
                </p>
                <h2 className="font-serif text-xl tracking-wide">即將用得上</h2>
              </header>
              <ProductGrid products={buckets.soon} />
            </section>
          )}
        </>
      )}

      <p className="mt-12 text-center text-xs text-ink-soft">
        💡 月齡只是參考，每個寶寶發展速度不同。挑選時也請媽媽自己評估。
      </p>
    </div>
  )
}
