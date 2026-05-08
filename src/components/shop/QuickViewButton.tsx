'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/stores/cartStore'
import { toast } from '@/components/shared/Toast'
import { formatTwd } from '@/lib/format'
import type { CartItem } from '@/types/cart'

interface Props {
  item: Omit<CartItem, 'quantity'>
  imageUrl: string | null
  outOfStock?: boolean
}

/**
 * Floating "Quick View" button overlaid on a ProductCard image. Opens a small
 * modal letting the user add to cart without leaving the listing.
 */
export function QuickViewButton({ item, imageUrl, outOfStock }: Props) {
  const [open, setOpen] = useState(false)
  const add = useCartStore((s) => s.add)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
        aria-label="快速瀏覽"
        className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-cream/95 backdrop-blur border border-line text-ink hover:bg-ink hover:text-cream transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center text-base shadow-md"
      >
        +
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-cream rounded-lg max-w-md w-full overflow-hidden shadow-2xl"
          >
            <div className="aspect-square bg-cream-100 relative">
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={item.nameZh}
                  className="w-full h-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="關閉"
                className="absolute top-2 right-2 w-9 h-9 rounded-full bg-cream/90 backdrop-blur text-ink text-xl leading-none flex items-center justify-center hover:bg-ink hover:text-cream"
              >
                ×
              </button>
            </div>
            <div className="p-5 space-y-3">
              <h3 className="font-serif text-lg leading-snug">{item.nameZh}</h3>
              <p className="text-2xl font-medium">{formatTwd(item.priceTwd)}</p>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={outOfStock}
                  onClick={() => {
                    add(item, 1)
                    toast.success(`已加入：${item.nameZh}`, 1500)
                    setOpen(false)
                  }}
                  className="font-jp flex-1 bg-ink text-cream py-3 rounded-md hover:bg-accent transition-colors disabled:opacity-50 tracking-wider"
                >
                  {outOfStock ? '完売 · 售完' : '加入購物車'}
                </button>
                <Link
                  href={`/shop/${item.slug}`}
                  onClick={() => setOpen(false)}
                  className="font-jp px-4 py-3 rounded-md border border-line hover:border-ink transition-colors text-sm tracking-wider whitespace-nowrap"
                >
                  看詳細
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
