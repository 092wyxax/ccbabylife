'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/stores/cartStore'
import { fetchCrossSellAction } from '@/server/actions/cross-sell'
import { imageUrl } from '@/lib/image'
import { formatTwd } from '@/lib/format'
import { toast } from '@/components/shared/Toast'
import type { CartItem } from '@/types/cart'

interface Suggestion {
  productId: string
  slug: string
  nameZh: string
  priceTwd: number
  weightG: number
  stockType: 'preorder' | 'in_stock'
  imagePath: string | null
}

/**
 * Recommends 3 products that share categories with current cart items
 * but aren't already in the cart. Shown in cart sidebar.
 */
export function CrossSell() {
  const items = useCartStore((s) => s.items)
  const add = useCartStore((s) => s.add)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  useEffect(() => {
    if (items.length === 0) {
      setSuggestions([])
      return
    }
    const cartIds = items.map((i) => i.productId)
    fetchCrossSellAction(cartIds, 3).then(setSuggestions).catch(() => setSuggestions([]))
  }, [items])

  if (suggestions.length === 0) return null

  return (
    <section className="mt-6 pt-6 border-t border-line">
      <p className="font-jp text-[10px] tracking-[0.3em] text-ink-soft mb-3">
        ALSO LIKED · 也許你會想加購
      </p>
      <div className="space-y-3">
        {suggestions.map((s) => (
          <div key={s.productId} className="flex items-start gap-3 text-sm">
            <Link
              href={`/shop/${s.slug}`}
              className="w-14 h-14 flex-shrink-0 bg-cream-100 rounded-md overflow-hidden block"
            >
              {s.imagePath && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl(s.imagePath)}
                  alt={s.nameZh}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                href={`/shop/${s.slug}`}
                className="text-xs leading-snug hover:text-accent line-clamp-2"
              >
                {s.nameZh}
              </Link>
              <p className="text-xs text-ink-soft mt-0.5">{formatTwd(s.priceTwd)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const item: Omit<CartItem, 'quantity'> = {
                  productId: s.productId,
                  slug: s.slug,
                  nameZh: s.nameZh,
                  priceTwd: s.priceTwd,
                  weightG: s.weightG,
                  imagePath: s.imagePath,
                  stockType: s.stockType,
                }
                add(item, 1)
                toast.success(`已加入：${s.nameZh}`, 1200)
              }}
              aria-label={`加購 ${s.nameZh}`}
              className="text-xs border border-line px-2 py-1 rounded-md hover:bg-ink hover:text-cream hover:border-ink transition-colors flex-shrink-0"
            >
              + 加購
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
