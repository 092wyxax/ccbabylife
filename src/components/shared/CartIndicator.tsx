'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/stores/cartStore'

export function CartIndicator() {
  const items = useCartStore((s) => s.items)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const count = mounted ? items.reduce((s, i) => s + i.quantity, 0) : 0

  return (
    <Link
      href="/cart"
      data-cart-icon
      className="relative text-sm text-ink-soft hover:text-ink inline-block"
      aria-label="購物車"
    >
      購物車
      {count > 0 && (
        <span className="absolute -top-2 -right-4 bg-accent text-cream text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  )
}
