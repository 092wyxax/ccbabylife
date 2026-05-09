import Link from 'next/link'
import Image from 'next/image'
import { listActiveProducts } from '@/server/services/ProductService'
import { listPublishedPosts } from '@/server/services/JournalService'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { NewsletterForm } from '@/components/shared/NewsletterForm'
import { SectionDivider } from '@/components/shared/SectionDivider'
import { CategoryShowcase } from '@/components/shared/CategoryShowcase'
import { imageUrl } from '@/lib/image'

const KANJI_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']


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
  const [featuredResult, latestPosts] = await Promise.all([
    listActiveProducts({ limit: 8 }),
    listPublishedPosts(),
  ])
  const featured = featuredResult.items
  const journalPosts = latestPosts.slice(0, 3)

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20 grid gap-10 lg:grid-cols-[1fr_400px] items-center">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-jp text-[11px] tracking-[0.3em] text-ink-soft">
                NIHON SELECT
              </span>
              <span className="h-px flex-1 max-w-[60px] bg-line" />
              <span className="font-jp text-[11px] text-ink-soft">にほんセレクト</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight max-w-xl tracking-wide">
              1 歲寶寶媽媽親身試用，<br />嚴選日系好物。
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
                className="bg-ink text-cream px-5 py-2.5 rounded-md hover:bg-accent transition-colors"
              >
                逛逛這週選物
              </Link>
              <Link
                href="/trending"
                className="border border-line px-5 py-2.5 rounded-md hover:border-ink transition-colors"
              >
                日本熱賣榜
              </Link>
              <Link
                href="/gift-guide"
                className="border border-line px-5 py-2.5 rounded-md hover:border-ink transition-colors"
              >
                彌月禮指南
              </Link>
            </div>

            {/* First-order welcome banner — drives newsletter signup */}
            <div className="mt-6 max-w-md p-4 rounded-lg bg-blush-soft/60 border border-blush/40 flex items-start gap-3">
              <span className="text-2xl flex-shrink-0" aria-hidden>
                🎁
              </span>
              <div className="flex-1 text-sm">
                <p className="font-medium mb-1">新朋友首單享 NT$100 折扣</p>
                <p className="text-xs text-ink-soft mb-3 leading-relaxed">
                  訂閱電子報或加 LINE，立刻收到專屬折扣碼。每月 1–2 封新品 / 截單預告，不轟炸。
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="#newsletter"
                    className="font-jp bg-seal text-cream text-xs px-3 py-2 rounded-md tracking-[0.15em] hover:opacity-90 transition-opacity"
                  >
                    🎁 訂閱電子報領折扣
                  </Link>
                  <a
                    href={
                      process.env.NEXT_PUBLIC_LINE_OA_URL ??
                      'https://line.me/R/ti/p/@ccbabylife'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-jp bg-[#06C755] text-white text-xs px-3 py-2 rounded-md tracking-[0.15em] hover:opacity-90 transition-opacity"
                  >
                    💚 加 LINE 享優惠
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:order-last">
            <div className="relative aspect-[4/5] bg-cream-100 border border-line overflow-hidden">
              <Image
                src="/hero.jpg"
                alt="熙熙初日｜日系選物店"
                fill
                priority
                fetchPriority="high"
                quality={85}
                sizes="(max-width: 1024px) 100vw, 400px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <CategoryShowcase title="依品項分類" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">FEATURED · 今週のおすすめ</p>
            <h2 className="font-serif text-2xl sm:text-3xl tracking-wide">本週嚴選</h2>
            <p className="text-ink-soft text-sm mt-2">娃媽用過 / 朋友親自挑回</p>
          </div>
          <Link href="/shop" className="text-sm text-ink-soft hover:text-accent">
            看全部 →
          </Link>
        </div>
        <ProductGrid products={featured} />
      </section>

      <SectionDivider />

      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">GIFT GUIDE · お祝いギフト</p>
            <h2 className="font-serif text-2xl sm:text-3xl mb-3 tracking-wide">彌月禮，挑得用心、不撞單</h2>
            <p className="text-ink-soft leading-relaxed mb-6 text-sm sm:text-base">
              選彌月禮兩個重點：實用（媽媽真的會用）+ 不撞（避免重複）。
              我們依預算分級，從 NT$500 紗布巾到 NT$3,000 包巾，幫你挑出對的東西。
            </p>
            <Link
              href="/gift-guide"
              className="inline-block bg-ink text-cream px-5 py-2.5 text-sm hover:bg-accent transition-colors"
            >
              看彌月禮指南 →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="aspect-square bg-cream-100 border border-line flex items-center justify-center text-ink-soft text-xs">
              NT$500 以下
            </div>
            <div className="aspect-square bg-cream-100 border border-line flex items-center justify-center text-ink-soft text-xs">
              NT$500–1,000
            </div>
            <div className="aspect-square bg-cream-100 border border-line flex items-center justify-center text-ink-soft text-xs">
              NT$1,000–3,000
            </div>
            <div className="aspect-square bg-accent/10 border border-accent/40 flex items-center justify-center text-accent text-xs font-medium">
              NT$3,000+
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-cream-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 grid gap-10 lg:grid-cols-2 items-center">
          <div className="lg:order-last">
            <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">FOR PETS · ペット用品</p>
            <h2 className="font-serif text-2xl sm:text-3xl mb-3 tracking-wide">寵物選物，朋友親自帶回</h2>
            <p className="text-ink-soft leading-relaxed mb-6 text-sm sm:text-base">
              日本貓狗用品設計細緻、用料講究 — 從零食、玩具到日常清潔。
              依規定不販售含肉類的貓狗食品（檢疫限制），但其他都精選。
            </p>
            <Link
              href="/shop?category=pet-supplies"
              className="inline-block bg-ink text-cream px-5 py-2.5 text-sm hover:bg-accent transition-colors"
            >
              看寵物選物 →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="aspect-square bg-cream border border-line flex items-center justify-center text-ink-soft text-xs">
              零食 · 潔牙
            </div>
            <div className="aspect-square bg-cream border border-line flex items-center justify-center text-ink-soft text-xs">
              玩具 · 抓板
            </div>
            <div className="aspect-square bg-cream border border-line flex items-center justify-center text-ink-soft text-xs">
              清潔 · 除臭
            </div>
            <div className="aspect-square bg-cream border border-line flex items-center justify-center text-ink-soft text-xs">
              外出 · 配件
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">DAILY · 日々のもの</p>
            <h2 className="font-serif text-2xl sm:text-3xl mb-3 tracking-wide">日常消耗品，用完就要補</h2>
            <p className="text-ink-soft leading-relaxed mb-6 text-sm sm:text-base">
              紗布巾、濕紙巾、餐具、奶瓶刷⋯⋯這類東西用得快、買得勤。
              預購制讓你下單後 10–14 天到貨，建議多備一份不斷貨。
            </p>
            <Link
              href="/shop?category=baby-essentials"
              className="inline-block bg-ink text-cream px-5 py-2.5 text-sm hover:bg-accent transition-colors"
            >
              看日常消耗品 →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="aspect-square bg-cream-100 border border-line flex items-center justify-center text-ink-soft text-xs">
              紗布巾 · 圍兜
            </div>
            <div className="aspect-square bg-cream-100 border border-line flex items-center justify-center text-ink-soft text-xs">
              濕紙巾 · 棉花棒
            </div>
            <div className="aspect-square bg-cream-100 border border-line flex items-center justify-center text-ink-soft text-xs">
              餐具 · 學習杯
            </div>
            <div className="aspect-square bg-cream-100 border border-line flex items-center justify-center text-ink-soft text-xs">
              奶瓶刷 · 清潔
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-cream-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <div className="text-center mb-12">
            <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">WHY US · 私たちの約束</p>
            <h2 className="font-serif text-2xl sm:text-3xl tracking-wide">為什麼選我們</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUE_PROPS.map((v, i) => (
              <div key={v.title} className="relative">
                <p className="font-jp text-4xl text-accent/40 mb-3 leading-none">
                  {KANJI_NUM[i]}
                </p>
                <h3 className="font-serif text-lg mb-2 tracking-wide">{v.title}</h3>
                <p className="text-sm text-ink-soft leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {journalPosts.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">JOURNAL · 雑記帖</p>
              <h2 className="font-serif text-2xl sm:text-3xl tracking-wide">娃媽真心話</h2>
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

      <section id="newsletter" className="border-t border-line bg-cream-100 scroll-mt-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16 text-center">
          <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-3">NEWSLETTER · お便り</p>
          <h2 className="font-serif text-2xl sm:text-3xl mb-3 tracking-wide">
            新朋友首單享 <span className="text-seal">NT$100</span> 折扣
          </h2>
          <p className="text-ink-soft text-sm sm:text-base leading-relaxed mb-6">
            每週新到貨直送 Email，完全不發行銷垃圾信。
          </p>

          <ul className="text-sm text-ink mb-6 space-y-2 inline-block text-left">
            <li className="flex items-start gap-2">
              <span className="text-sage mt-0.5" aria-hidden>✓</span>
              <span>新品上架第一個收到</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sage mt-0.5" aria-hidden>✓</span>
              <span>寶寶月齡專屬推薦</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sage mt-0.5" aria-hidden>✓</span>
              <span>截單前 6 小時提醒</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sage mt-0.5" aria-hidden>✓</span>
              <span>訂閱即送 <strong>NT$100 首單折扣碼</strong></span>
            </li>
          </ul>

          <div className="max-w-md mx-auto">
            <NewsletterForm source="home-bottom" />
          </div>

          <p className="text-[11px] text-ink-soft mt-4">
            🔒 我們不會把你的 email 給任何人。隨時可以一鍵退訂。
          </p>
        </div>
      </section>
    </>
  )
}
