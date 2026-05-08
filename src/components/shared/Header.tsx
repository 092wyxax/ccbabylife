import Link from 'next/link'
import { CartIndicator } from './CartIndicator'
import { MobileNav } from './MobileNav'
import { CouponBanner } from './CouponBanner'
import { getCustomerSession } from '@/lib/customer-session'

const NAV_ITEMS = [
  { href: '/shop', label: '選物' },
  { href: '/brand', label: '品牌' },
  { href: '/trending', label: '日本熱賣榜' },
  { href: '/insta-picks', label: '媽媽選書' },
  { href: '/seasonal', label: '季節限定' },
  { href: '/journal', label: '部落格' },
  { href: '/about', label: '關於我們' },
]

export async function Header() {
  const session = await getCustomerSession()
  return (
    <header className="border-b border-line bg-cream/90 backdrop-blur sticky top-0 z-30">
      <CouponBanner />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2 text-ink leading-none">
          <span className="font-serif text-xl tracking-wide">熙熙初日</span>
          <span className="hidden sm:inline font-jp text-[11px] tracking-[0.2em] text-ink-soft">
            日系選物店
          </span>
        </Link>
        <nav className="hidden sm:flex items-center gap-8 text-sm">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-ink-soft hover:text-ink transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/shop"
            aria-label="搜尋商品"
            className="text-ink-soft hover:text-ink"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </Link>
          <CartIndicator />
          <Link
            href="/account"
            className="font-jp hidden sm:inline-flex text-sm bg-ink text-cream px-3 py-1.5 rounded-md hover:bg-accent transition-colors tracking-wider"
          >
            {session ? '會員中心' : '登入'}
          </Link>
          <MobileNav
            items={[
              ...NAV_ITEMS,
              { href: '/account', label: session ? '會員中心' : '登入' },
            ]}
          />
        </div>
      </div>
    </header>
  )
}
