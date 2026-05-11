import Link from 'next/link'
import { and, asc, eq, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { brands, products } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { BRAND_STORIES } from '@/lib/japan-content'

export const metadata = {
  title: '日本嬰幼品牌精選 — Pigeon、Combi、Richell、MikiHouse',
  description:
    '熙熙初日嚴選的日本嬰幼用品品牌：Pigeon（貝親）、Combi、Richell（利其爾）、MikiHouse、Doggy Man — 每個品牌的故事、招牌商品、媽媽試用心得與選擇理由。',
}

export const dynamic = 'force-dynamic'

export default async function BrandsPage() {
  const rows = await db
    .select({
      brand: brands,
      productCount: sql<number>`count(${products.id})::int`,
    })
    .from(brands)
    .leftJoin(
      products,
      and(
        eq(products.brandId, brands.id),
        eq(products.status, 'active')
      )
    )
    .where(eq(brands.orgId, DEFAULT_ORG_ID))
    .groupBy(brands.id)
    .orderBy(asc(brands.nameZh))

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <header className="mb-10">
        <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">
          BRANDS · ブランド
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl tracking-wide mb-4">
          我們選的品牌
        </h1>
        <p className="text-ink-soft text-sm sm:text-base leading-relaxed max-w-2xl">
          每一個出現在這裡的品牌，都是我家寶寶實際在用的、或日本婦產科出院贈品內的常駐名單。
          不是「日本品牌就好」，而是「**這個品牌的這個產品，比台灣本地能買到的版本更好**」。
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="bg-white border border-line rounded-lg p-12 text-center text-ink-soft text-sm">
          目前還沒有品牌資料。商品上架後會自動顯示。
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          {rows.map(({ brand, productCount }) => {
            const story = BRAND_STORIES[brand.slug]
            return (
              <Link
                key={brand.id}
                href={`/brand/${brand.slug}`}
                className="bg-white border border-line rounded-lg p-6 sm:p-7 hover:border-ink transition-colors flex flex-col"
              >
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <h2 className="font-serif text-2xl tracking-wide">
                    {brand.nameZh}
                  </h2>
                  {story?.foundedYear && (
                    <span className="font-jp text-[11px] tracking-[0.2em] text-ink-soft whitespace-nowrap">
                      EST. {story.foundedYear}
                    </span>
                  )}
                </div>
                {brand.nameJp && (
                  <p className="font-jp text-xs text-ink-soft tracking-wider mb-4">
                    {brand.nameJp}
                  </p>
                )}

                {story?.headline && (
                  <p className="text-sm leading-relaxed mb-5">
                    {story.headline}
                  </p>
                )}

                <div className="flex-1" />

                <div className="flex items-center justify-between text-xs text-ink-soft pt-4 border-t border-line">
                  <span>{productCount} 件選物</span>
                  <span className="text-ink">進入品牌頁 →</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <p className="mt-12 text-xs text-ink-soft leading-relaxed">
        ⚠ 寵物品牌（如 Doggy Man）僅代購非含肉類商品 — 依《台灣動物傳染病防治條例》。
        嬰兒配方奶粉所有品牌一律不販售 — 依《嬰兒配方食品查驗登記辦法》。
      </p>
    </div>
  )
}
