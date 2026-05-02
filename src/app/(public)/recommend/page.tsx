import Link from 'next/link'
import { listProductsByAge } from '@/server/services/ProductService'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { AgeRecommenderInput } from '@/components/tools/AgeRecommender'

export const metadata = {
  title: '月齡推薦器 | 日系選物店',
  description: '依寶寶月齡推薦適合的日系母嬰選物。每階段需要的東西不同，我們幫妳挑出來。',
}

interface Props {
  searchParams: Promise<{ bornAt?: string }>
}

function calcAgeMonths(bornAt: string): number | null {
  // bornAt format: YYYY-MM
  const m = bornAt.match(/^(\d{4})-(\d{2})$/)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  if (year < 1990 || year > 2100 || month < 1 || month > 12) return null

  const now = new Date()
  const months = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month)
  if (months < 0 || months > 240) return null
  return months
}

export default async function RecommendPage({ searchParams }: Props) {
  const params = await searchParams
  const bornAt = params.bornAt ?? null
  const ageMonths = bornAt ? calcAgeMonths(bornAt) : null

  const buckets = ageMonths != null ? await listProductsByAge(ageMonths) : null

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-ink-soft mb-3">
          Tool · 月齡推薦器
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl mb-3">
          妳家寶貝幾個月了？
        </h1>
        <p className="text-ink-soft max-w-2xl leading-relaxed">
          每個月齡需要的東西不一樣。新生兒要紗布巾，6 個月開始要餐具，
          1 歲後玩具要升級。這支工具幫妳從目前的選物中，挑出**現在適用**與**下個階段**會用到的商品。
        </p>
      </header>

      <AgeRecommenderInput initialBornAt={bornAt} />

      {ageMonths != null && buckets && (
        <div className="mt-12 space-y-16">
          <section>
            <header className="mb-6 flex items-baseline justify-between">
              <div>
                <h2 className="font-serif text-2xl mb-1">
                  寶寶 {ageMonths} 個月，現在適用
                </h2>
                <p className="text-ink-soft text-sm">
                  目前月齡可以直接使用的選物
                </p>
              </div>
              <span className="text-sm text-ink-soft">
                {buckets.fits.length} 件
              </span>
            </header>

            {buckets.fits.length === 0 ? (
              <EmptyState>
                目前沒有專門針對 {ageMonths} 個月設計的商品。
                可以先逛 <Link href="/shop" className="underline hover:text-accent">所有選物</Link>，或試試其他月齡。
              </EmptyState>
            ) : (
              <ProductGrid products={buckets.fits} />
            )}
          </section>

          {buckets.soon.length > 0 && (
            <section>
              <header className="mb-6 flex items-baseline justify-between">
                <div>
                  <h2 className="font-serif text-2xl mb-1">
                    下個階段（3 個月內會用到）
                  </h2>
                  <p className="text-ink-soft text-sm">
                    寶寶長得比想像快，提前 1–2 週預訂剛好趕上
                  </p>
                </div>
                <span className="text-sm text-ink-soft">
                  {buckets.soon.length} 件
                </span>
              </header>
              <ProductGrid products={buckets.soon} />
            </section>
          )}

          <section className="bg-cream-100 border border-line rounded-lg p-8 text-sm">
            <p className="font-medium mb-2">想每月自動收到推薦？</p>
            <p className="text-ink-soft leading-relaxed">
              加入我們的 LINE 並登記寶寶生日，每滿一個月會自動推送該月齡適合的選物。
              （Phase 3 開放，現階段請手動回來看）
            </p>
          </section>
        </div>
      )}

      {ageMonths == null && bornAt && (
        <div className="mt-8">
          <EmptyState>
            日期格式有誤或超出合理範圍，請重新選擇出生年月。
          </EmptyState>
        </div>
      )}
    </div>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-12 text-center text-ink-soft border border-dashed border-line rounded-lg">
      {children}
    </div>
  )
}
