'use client'

import { useEffect, useState } from 'react'
import { useCartStore } from '@/stores/cartStore'
import { toast } from '@/components/shared/Toast'
import { formatTwd } from '@/lib/format'
import type { CartItem } from '@/types/cart'

interface Props {
  item: Omit<CartItem, 'quantity'>
  outOfStock?: boolean
}

/**
 * Mobile-only sticky bottom bar that mirrors the desktop AddToCartButton.
 * Becomes visible after the user scrolls past the hero block (~400px).
 */
export function StickyMobileCTA({ item, outOfStock }: Props) {
  const add = useCartStore((s) => s.add)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <div
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-cream/95 backdrop-blur border-t border-line p-3 flex items-center gap-3 shadow-lg"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink-soft truncate">{item.nameZh}</p>
        <p className="font-medium">{formatTwd(item.priceTwd)}</p>
      </div>
      <button
        type="button"
        disabled={outOfStock}
        onClick={() => {
          add(item, 1)
          toast.success('已加入購物車', 1500)
        }}
        className="font-jp px-4 py-3 rounded-md text-cream bg-ink hover:bg-accent transition-colors disabled:opacity-50 tracking-wider whitespace-nowrap"
      >
        {outOfStock ? '完売' : '加入購物車'}
      </button>
    </div>
  )
}
