'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/stores/cartStore'
import { useWishlistStore } from '@/stores/wishlistStore'

export function MobileBottomNav() {
  const pathname = usePathname()
  const cartCount = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.quantity, 0)
  )
  const wishCount = useWishlistStore((s) => s.items.length)

  // Hide on admin, account auth-only pages, and pages where bottom-CTA conflicts
  if (pathname.startsWith('/admin')) return null
  if (pathname.startsWith('/checkout')) return null
  if (pathname.startsWith('/pay/')) return null

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-cream/95 backdrop-blur border-t border-line flex">
      <NavItem
        href="/"
        active={pathname === '/'}
        label="首頁"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        }
      />
      <NavItem
        href="/shop"
        active={pathname.startsWith('/shop')}
        label="選物"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        }
      />
      <NavItem
        href="/account/wishlist"
        active={pathname === '/account/wishlist'}
        label="收藏"
        badge={wishCount > 0 ? wishCount : undefined}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        }
      />
      <NavItem
        href={cartCount > 0 ? '/cart' : '/shop'}
        active={pathname === '/cart' || (cartCount === 0 && pathname === '/shop')}
        label={cartCount > 0 ? '購物車' : '逛選物'}
        badge={cartCount > 0 ? cartCount : undefined}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        }
      />
      <NavItem
        href="/account"
        active={pathname.startsWith('/account') && pathname !== '/account/wishlist'}
        label="我的"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        }
      />
    </nav>
  )
}

function NavItem({
  href,
  active,
  label,
  icon,
  badge,
}: {
  href: string
  active: boolean
  label: string
  icon: React.ReactNode
  badge?: number
}) {
  return (
    <Link
      href={href}
      className={
        'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors relative ' +
        (active ? 'text-ink' : 'text-ink-soft')
      }
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}
    >
      <span className="relative">
        {icon}
        {badge !== undefined && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-accent text-cream text-[10px] rounded-full flex items-center justify-center font-medium">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      <span className="font-jp text-[10px] tracking-wider">{label}</span>
    </Link>
  )
}
