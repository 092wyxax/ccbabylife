import Link from 'next/link'
import { listActiveProducts } from '@/server/services/ProductService'
import { listPublishedPosts } from '@/server/services/JournalService'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { imageUrl } from '@/lib/image'

export default async function HomePage() {
  const [featured, latestPosts] = await Promise.all([
    listActiveProducts({ limit: 8 }),
    listPublishedPosts(),
  ])
  const journalPosts = latestPosts.slice(0, 3)

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
              href="/recommend"
              className="border border-line px-5 py-3 rounded-full hover:border-ink transition-colors"
            >
              月齡推薦器
            </Link>
            <Link
              href="/about"
              className="border border-line px-5 py-3 rounded-full hover:border-ink transition-colors"
            >
              關於我們
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

      <section className="border-t border-line bg-cream-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 grid gap-8 lg:grid-cols-2 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-ink-soft mb-3">
              Gift Guide
            </p>
            <h2 className="font-serif text-3xl mb-3">彌月禮，挑得用心、不撞單</h2>
            <p className="text-ink-soft leading-relaxed mb-6">
              選彌月禮兩個重點：實用（媽媽真的會用）+ 不撞（避免重複）。
              我們依預算分級，從 NT$500 紗布巾到 NT$3,000 包巾，幫你挑出對的東西。
            </p>
            <Link
              href="/gift-guide"
              className="inline-block bg-ink text-cream px-5 py-3 rounded-full text-sm hover:bg-accent transition-colors"
            >
              看彌月禮指南 →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-square bg-white border border-line rounded-md flex items-center justify-center text-ink-soft text-xs">
              NT$500 以下
            </div>
            <div className="aspect-square bg-white border border-line rounded-md flex items-center justify-center text-ink-soft text-xs">
              NT$500–1,000
            </div>
            <div className="aspect-square bg-white border border-line rounded-md flex items-center justify-center text-ink-soft text-xs">
              NT$1,000–3,000
            </div>
            <div className="aspect-square bg-accent/10 border border-accent/40 rounded-md flex items-center justify-center text-accent text-xs font-medium">
              NT$3,000+
            </div>
          </div>
        </div>
      </section>

      {journalPosts.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl">娃媽真心話</h2>
              <p className="text-ink-soft text-sm mt-2">選物觀點 · 真實使用心得</p>
            </div>
            <Link href="/journal" className="text-sm text-ink-soft hover:text-accent">
              所有文章 →
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {journalPosts.map((p) => (
              <Link
                key={p.id}
                href={`/journal/${p.slug}`}
                className="group block"
              >
                <div className="aspect-video bg-cream-100 border border-line rounded-md overflow-hidden mb-3">
                  {p.heroImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={imageUrl(p.heroImage)}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : null}
                </div>
                {p.publishedAt && (
                  <p className="text-xs text-ink-soft mb-1">
                    {new Date(p.publishedAt).toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
                <h3 className="font-serif text-lg group-hover:text-accent transition-colors mb-1">
                  {p.title}
                </h3>
                {p.excerpt && (
                  <p className="text-sm text-ink-soft line-clamp-2 leading-relaxed">
                    {p.excerpt}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
