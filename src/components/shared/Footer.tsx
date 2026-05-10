import Link from 'next/link'
import { NewsletterForm } from './NewsletterForm'
import { BrandMark } from './BrandMark'

export function Footer() {
  return (
    <footer className="border-t border-line bg-cream-100 mt-24 relative">
      {/* Decorative wave at the very top */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-2 bg-cream"
        style={{
          maskImage:
            'radial-gradient(circle at 20px 0, transparent 8px, black 9px)',
          WebkitMaskImage:
            'radial-gradient(circle at 20px 0, transparent 8px, black 9px)',
          maskSize: '40px 16px',
          WebkitMaskSize: '40px 16px',
          maskRepeat: 'repeat-x',
          WebkitMaskRepeat: 'repeat-x',
        }}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <BrandMark className="w-7 h-7 text-seal" />
            <h3 className="font-serif text-lg tracking-wide">熙熙初日</h3>
          </div>
          <p className="font-jp text-[11px] tracking-[0.25em] text-ink-soft mb-4">
            日系選物店
          </p>
          <p className="text-ink-soft leading-relaxed mb-5">
            日本媽媽親身試用、嚴選日系好物。<br />
            予約制：毎週日 23:59 締切。
          </p>
          <p className="font-jp text-xs text-ink-soft mb-2 tracking-[0.3em]">
            お便り · NEWSLETTER
          </p>
          <NewsletterForm source="footer" />
        </div>

        <div>
          <h4 className="font-jp font-medium mb-3 text-ink-soft text-xs tracking-[0.3em]">
            選物 · SHOP
          </h4>
          <ul className="space-y-2">
            <li><Link href="/shop" className="hover:text-accent">所有商品</Link></li>
            <li><Link href="/trending" className="hover:text-accent">日本熱賣榜</Link></li>
            <li><Link href="/insta-picks" className="hover:text-accent">媽媽選書</Link></li>
            <li><Link href="/seasonal" className="hover:text-accent">季節限定</Link></li>
            <li><Link href="/gift-guide" className="hover:text-accent">彌月禮指南</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-jp font-medium mb-3 text-ink-soft text-xs tracking-[0.3em]">
            営業案內 · INFO
          </h4>
          <dl className="space-y-2 text-ink-soft">
            <div className="flex gap-3">
              <dt className="font-jp shrink-0 w-14 text-ink/70">締切</dt>
              <dd>毎週日 23:59</dd>
            </div>
            <div className="flex gap-3">
              <dt className="font-jp shrink-0 w-14 text-ink/70">入荷</dt>
              <dd>下單後 10–14 日到貨</dd>
            </div>
            <div className="flex gap-3">
              <dt className="font-jp shrink-0 w-14 text-ink/70">配送</dt>
              <dd>黑貓宅急便</dd>
            </div>
            <div className="flex gap-3">
              <dt className="font-jp shrink-0 w-14 text-ink/70">定休日</dt>
              <dd>無（網店全年無休）</dd>
            </div>
          </dl>
        </div>

        <div>
          <h4 className="font-jp font-medium mb-3 text-ink-soft text-xs tracking-[0.3em]">
            関於 · ABOUT
          </h4>
          <ul className="space-y-2">
            <li><Link href="/about" className="hover:text-accent">品牌故事 + 法規誠信</Link></li>
            <li><Link href="/faq" className="hover:text-accent">常見問題</Link></li>
            <li><Link href="/journal" className="hover:text-accent">日系選物筆記</Link></li>
            <li><Link href="/recommend" className="hover:text-accent">月齡選物器</Link></li>
            <li><Link href="/calculator" className="hover:text-accent">透明定價試算</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between gap-3 text-xs text-ink-soft">
          <span>© {new Date().getFullYear()} 熙熙初日｜日系選物店 · 統編 60766849</span>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/privacy" className="hover:text-accent font-jp tracking-wider">
              隱私權政策
            </Link>
            <span className="text-line">·</span>
            <Link href="/terms" className="hover:text-accent font-jp tracking-wider">
              服務條款
            </Link>
            <span className="text-line">·</span>
            <span className="font-jp tracking-wider">
              日本平行輸入　個人選物
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
