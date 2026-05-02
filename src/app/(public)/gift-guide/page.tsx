import Link from 'next/link'
import { listGiftProducts, GIFT_TIERS } from '@/server/services/ProductService'
import { ProductGrid } from '@/components/shop/ProductGrid'

export const metadata = {
  title: '彌月禮指南 | 日系選物店',
  description: '依預算分級選購日系彌月禮，從紗布巾、固齒器到精選玩具。',
}

interface Props {
  searchParams: Promise<{ tier?: string }>
}

export default async function GiftGuidePage({ searchParams }: Props) {
  const params = await searchParams
  const activeTier = GIFT_TIERS.find((t) => t.key === params.tier) ?? GIFT_TIERS[1] // 預設 500–1000

  const items = await listGiftProducts({
    minTwd: activeTier.minTwd,
    maxTwd: activeTier.maxTwd,
  })

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-widest text-ink-soft mb-3">
          Gift Guide
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl mb-3">彌月禮指南</h1>
        <p className="text-ink-soft max-w-2xl leading-relaxed">
          選彌月禮兩個重點：<strong>實用</strong>（媽媽真的會用）+ <strong>不撞</strong>（避免重複）。
          我們依預算分級，幫你挑出對的東西，不踩雷。
        </p>
      </header>

      <div className="mb-8 flex flex-wrap gap-2 pb-4 border-b border-line">
        {GIFT_TIERS.map((t) => (
          <Link
            key={t.key}
            href={`/gift-guide?tier=${t.key}`}
            className={
              'text-sm px-4 py-2 rounded-full border transition-colors ' +
              (activeTier.key === t.key
                ? 'bg-ink text-cream border-ink'
                : 'border-line text-ink-soft hover:border-ink hover:text-ink')
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      <h2 className="font-serif text-xl mb-6">
        {activeTier.label} · {items.length} 件選物
      </h2>

      {items.length === 0 ? (
        <div className="py-16 text-center text-ink-soft border border-dashed border-line rounded-lg">
          這個預算區間目前沒有商品。試試其他區間。
        </div>
      ) : (
        <ProductGrid products={items} />
      )}

      <section className="mt-16 grid sm:grid-cols-3 gap-4 text-sm">
        <div className="bg-cream-100 border border-line rounded-lg p-5">
          <p className="font-medium mb-1">選紗布巾、奶嘴布</p>
          <p className="text-ink-soft text-xs leading-relaxed">
            幾乎不撞單、消耗品永遠不嫌多。預算 NT$500 以下首選。
          </p>
        </div>
        <div className="bg-cream-100 border border-line rounded-lg p-5">
          <p className="font-medium mb-1">中段預算選工具型</p>
          <p className="text-ink-soft text-xs leading-relaxed">
            固齒器、餐具、推車涼感扇 —— 6 個月後天天用得到，預算 NT$500–1,500 甜蜜點。
          </p>
        </div>
        <div className="bg-cream-100 border border-line rounded-lg p-5">
          <p className="font-medium mb-1">高預算建議買「升級」</p>
          <p className="text-ink-soft text-xs leading-relaxed">
            送相對昂貴但「自己捨不得買」的單品 —— 例如更厚的包巾、更高階的安撫娃娃。
          </p>
        </div>
      </section>
    </div>
  )
}
