import Link from 'next/link'
import { listActiveProducts } from '@/server/services/ProductService'
import { listPublishedPosts } from '@/server/services/JournalService'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { NewsletterForm } from '@/components/shared/NewsletterForm'
import { imageUrl } from '@/lib/image'

const QUICK_CATEGORIES = [
  { label: '0–6 個月', en: 'Newborn', href: '/recommend' },
  { label: '6–12 個月', en: 'Baby', href: '/recommend' },
  { label: '1–2 歲', en: 'Toddler', href: '/recommend' },
  { label: '2 歲以上', en: 'Kids', href: '/recommend' },
  { label: '彌月送禮', en: 'Gift Guide', href: '/gift-guide' },
  { label: '日常消耗品', en: 'Daily Essentials', href: '/shop?category=baby-essentials' },
  { label: '寵物用品', en: 'For Pets', href: '/shop?category=pet-supplies' },
  { label: '新到貨', en: 'Just In', href: '/shop' },
]

const VALUE_PROPS = [
  {
    title: '娃媽親身試用',
    desc: '我家娃日常用著的東西，才會出現在這裡。每件商品的「使用心得」是真實感受，含優缺點。',
  },
  {
    title: '預購制 · 不囤貨',
    desc: '週日截單、週一日本下單，10–14 天到貨。沒有水貨倉、沒有過期庫存，新鮮直送。',
  },
  {
    title: '法規誠信',
    desc: '需查驗登記的商品（嬰兒奶粉、處方藥、含肉寵物食品）一律不賣。即使客戶問也婉拒。',
  },
  {
    title: '透明定價',
    desc: '日幣 × 匯率 + 運費 + 服務費 + 利潤 — 公式公開、無隱藏費用、無平台抽成。',
  },
]

export default async function HomePage() {
  const [featured, latestPosts] = await Promise.all([
    listActiveProducts({ limit: 8 }),
    listPublishedPosts(),
  ])
  const journalPosts = latestPosts.slice(0, 3)

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20 grid gap-10 lg:grid-cols-[1fr_400px] items-center">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-ink-soft mb-3">
              Nihon Select
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight max-w-xl">
              1 歲娃媽親身試用，<br />嚴選日系好物。
            </h1>
            <p className="text-ink-soft mt-5 max-w-lg leading-relaxed text-sm sm:text-base">
              每週日截單、週一日本下單，10–14 天到貨。<br />
              不販售需查驗登記商品 —{' '}
              <Link href="/about" className="underline decoration-line hover:decoration-accent">
                法規誠信宣告
              </Link>
              。
            </p>

            <div className="mt-8 flex flex-wrap gap-2 text-sm">
              <Link
                href="/shop"
                className="bg-ink text-cream px-5 py-2.5 rounded-full hover:bg-accent transition-colors"
              >
                逛逛這週選物
              </Link>
              <Link
                href="/recommend"
                className="border border-line px-5 py-2.5 rounded-full hover:border-ink transition-colors"
              >
                月齡推薦器
              </Link>
              <Link
                href="/gift-guide"
                className="border border-line px-5 py-2.5 rounded-full hover:border-ink transition-colors"
              >
                彌月禮指南
              </Link>
            </div>
          </div>

          <div className="lg:order-last">
            <div className="aspect-[4/5] bg-cream-100 border border-line rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero.jpg"
                alt="日系選物店"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <header className="flex items-baseline justify-between mb-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-soft mb-1">
                Browse
              </p>
              <h2 className="font-serif text-xl sm:text-2xl">依需求快速逛</h2>
            </div>
            <Link href="/shop" className="text-sm text-ink-soft hover:text-accent">
              全部 →
            </Link>
          </header>

          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden">
            {QUICK_CATEGORIES.map((c, i) => (
              <li key={c.label}>
                <Link
                  href={c.href}
                  className="group block bg-cream hover:bg-cream-100 transition-colors h-full p-5 sm:p-6"
                >
                  <p className="font-serif text-2xl text-accent/40 group-hover:text-accent transition-colors mb-2">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <p className="font-medium text-base mb-1">{c.label}</p>
                  <p className="text-[10px] tracking-[0.15em] uppercase text-ink-soft">
                    {c.en}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">Featured</p>
            <h2 className="font-serif text-2xl sm:text-3xl">本週嚴選</h2>
            <p className="text-ink-soft text-sm mt-2">娃媽用過 / 朋友親自挑回</p>
          </div>
          <Link href="/shop" className="text-sm text-ink-soft hover:text-accent">
            看全部 →
          </Link>
        </div>
        <ProductGrid products={featured} />
      </section>

      <section className="border-y border-line bg-cream-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">Why Us</p>
            <h2 className="font-serif text-2xl sm:text-3xl">為什麼選我們</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUE_PROPS.map((v, i) => (
              <div key={v.title}>
                <p className="font-serif text-3xl text-accent/40 mb-3">
                  0{i + 1}
                </p>
                <h3 className="font-serif text-lg mb-2">{v.title}</h3>
                <p className="text-sm text-ink-soft leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">Gift Guide</p>
            <h2 className="font-serif text-2xl sm:text-3xl mb-3">彌月禮，挑得用心、不撞單</h2>
            <p className="text-ink-soft leading-relaxed mb-6 text-sm sm:text-base">
              選彌月禮兩個重點：實用（媽媽真的會用）+ 不撞（避免重複）。
              我們依預算分級，從 NT$500 紗布巾到 NT$3,000 包巾，幫你挑出對的東西。
            </p>
            <Link
              href="/gift-guide"
              className="inline-block bg-ink text-cream px-5 py-2.5 rounded-full text-sm hover:bg-accent transition-colors"
            >
              看彌月禮指南 →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="aspect-square bg-cream-100 border border-line rounded-md flex items-center justify-center text-ink-soft text-xs">
              NT$500 以下
            </div>
            <div className="aspect-square bg-cream-100 border border-line rounded-md flex items-center justify-center text-ink-soft text-xs">
              NT$500–1,000
            </div>
            <div className="aspect-square bg-cream-100 border border-line rounded-md flex items-center justify-center text-ink-soft text-xs">
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
              <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">Journal</p>
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

      <section className="border-t border-line bg-cream-100">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 text-center">
          <p className="text-xs uppercase tracking-widest text-ink-soft mb-3">Newsletter</p>
          <h2 className="font-serif text-2xl sm:text-3xl mb-3">新選物上架先收到</h2>
          <p className="text-ink-soft text-sm sm:text-base leading-relaxed mb-6">
            每週新到貨直送 Email。完全不會發行銷垃圾信。
          </p>
          <div className="max-w-md mx-auto">
            <NewsletterForm source="home-bottom" />
          </div>
        </div>
      </section>
    </>
  )
}
