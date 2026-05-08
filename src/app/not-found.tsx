import Link from 'next/link'
import { listActiveProducts } from '@/server/services/ProductService'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { NotFoundIllustration } from '@/components/shared/BrandIllustrations'

export default async function NotFound() {
  let topProducts: Awaited<ReturnType<typeof listActiveProducts>> = []
  try {
    topProducts = (await listActiveProducts({ limit: 4 })).slice(0, 4)
  } catch {
    // DB unavailable during build — render without recommendations
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream text-ink">
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <p className="font-jp text-[11px] tracking-[0.3em] text-ink-soft mb-6">
          404 · ページが見つかりません
        </p>

        <div className="text-seal mb-6">
          <NotFoundIllustration className="w-56 h-44" />
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl mb-3 tracking-wide">
          找不到這個頁面
        </h1>
        <p className="text-ink-soft text-sm max-w-md leading-relaxed mb-8">
          商品可能已下架，或網址打錯了。
          <br className="hidden sm:inline" />
          回到首頁逛逛，或來找客服聊聊吧 💬
        </p>

        <div className="flex flex-wrap gap-3 justify-center text-sm mb-12">
          <Link
            href="/"
            className="font-jp bg-ink text-cream px-5 py-3 rounded-md hover:bg-accent transition-colors tracking-wider"
          >
            ホームへ · 回首頁
          </Link>
          <Link
            href="/shop"
            className="font-jp border border-line bg-white px-5 py-3 rounded-md hover:border-ink transition-colors tracking-wider"
          >
            全商品 · 所有選物
          </Link>
          <Link
            href="/faq"
            className="font-jp border border-line bg-white px-5 py-3 rounded-md hover:border-ink transition-colors tracking-wider"
          >
            常見問題
          </Link>
        </div>

        {topProducts.length > 0 && (
          <section className="w-full max-w-5xl">
            <h2 className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-4">
              POPULAR · 看看這些
            </h2>
            <ProductGrid products={topProducts} />
          </section>
        )}
      </main>
    </div>
  )
}
