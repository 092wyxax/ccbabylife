import Link from 'next/link'
import { CartIndicator } from './CartIndicator'
import { MobileNav } from './MobileNav'
import { getCustomerSession } from '@/lib/customer-session'

const NAV_ITEMS = [
  { href: '/shop', label: '選物' },
  { href: '/recommend', label: '月齡推薦' },
  { href: '/journal', label: '部落格' },
  { href: '/about', label: '關於我們' },
]

export async function Header() {
  const session = await getCustomerSession()
  return (
    <header className="border-b border-line bg-cream/90 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl tracking-wide text-ink">
          日系選物店
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
          <CartIndicator />
          <Link
            href="/account"
            className="hidden sm:inline-flex text-sm bg-ink text-cream px-3 py-1.5 rounded-full hover:bg-accent transition-colors"
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
