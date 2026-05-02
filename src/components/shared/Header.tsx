import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/shop', label: '選物' },
  { href: '/calculator', label: '報價計算機' },
  { href: '/journal', label: '部落格' },
  { href: '/about', label: '關於我們' },
]

export function Header() {
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
        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            className="text-sm text-ink-soft hover:text-ink"
            aria-label="購物車"
          >
            購物車
          </Link>
          <Link
            href="/account"
            className="text-sm bg-ink text-cream px-3 py-1.5 rounded-full hover:bg-accent transition-colors"
          >
            登入
          </Link>
        </div>
      </div>
    </header>
  )
}
