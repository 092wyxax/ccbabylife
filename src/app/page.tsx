import Link from 'next/link'
import { listActiveProducts } from '@/server/services/ProductService'
import { ProductGrid } from '@/components/shop/ProductGrid'

export default async function HomePage() {
  const featured = await listActiveProducts({ limit: 8 })

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
          <p className="text-xs tracking-[0.3em] uppercase text-ink-soft mb-4">
            Nihon Select · 日本平行輸入個人選物
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl leading-tight max-w-2xl">
            1 歲娃媽親身試用，<br />嚴選日系好物。
          </h1>
          <p className="text-ink-soft mt-6 max-w-xl leading-relaxed">
            每週日截單、週一日本下單，10–14 天到貨。<br />
            我們不販售需查驗登記商品 —{' '}
            <Link href="/about" className="underline decoration-line hover:decoration-accent">
              這是我們的法規誠信宣告
            </Link>
            。
          </p>

          <div className="mt-10 flex flex-wrap gap-3 text-sm">
            <Link
              href="/shop"
              className="bg-ink text-cream px-5 py-3 rounded-full hover:bg-accent transition-colors"
            >
              逛逛這週選物
            </Link>
            <Link
              href="/calculator"
              className="border border-line px-5 py-3 rounded-full hover:border-ink transition-colors"
            >
              貼日本連結報價
            </Link>
            <Link
              href="/recommend"
              className="border border-line px-5 py-3 rounded-full hover:border-ink transition-colors"
            >
              月齡推薦器
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl">本週嚴選</h2>
            <p className="text-ink-soft text-sm mt-2">娃媽用過 / 朋友親自挑回</p>
          </div>
          <Link href="/shop" className="text-sm text-ink-soft hover:text-accent">
            看全部 →
          </Link>
        </div>

        <ProductGrid products={featured} />
      </section>
    </>
  )
}
