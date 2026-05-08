'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { imageUrl } from '@/lib/image'
import { formatTwd } from '@/lib/format'

interface Item {
  productId: string
  slug: string
  nameZh: string
  priceTwd: number
  imagePath: string | null
  viewedAt: number
}

const STORAGE_KEY = 'recently_viewed'
const MAX = 12

/**
 * Records the current product into localStorage and renders the previously
 * viewed items (excluding self). Mounted on every product detail page.
 */
export function RecentlyViewedRecorder({
  productId,
  slug,
  nameZh,
  priceTwd,
  imagePath,
}: Omit<Item, 'viewedAt'>) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const list: Item[] = raw ? JSON.parse(raw) : []
      const filtered = list.filter((i) => i.productId !== productId)
      filtered.unshift({
        productId,
        slug,
        nameZh,
        priceTwd,
        imagePath,
        viewedAt: Date.now(),
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX)))
    } catch {
      /* ignore quota errors */
    }
  }, [productId, slug, nameZh, priceTwd, imagePath])

  return null
}

/**
 * Displays the recently-viewed strip (excluding optionally the current
 * product). Hidden when nothing to show.
 */
export function RecentlyViewedStrip({ excludeProductId }: { excludeProductId?: string }) {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const list: Item[] = raw ? JSON.parse(raw) : []
      setItems(
        list.filter((i) => !excludeProductId || i.productId !== excludeProductId).slice(0, 8)
      )
    } catch {
      setItems([])
    }
  }, [excludeProductId])

  if (items.length === 0) return null

  return (
    <section className="mt-12 pt-8 border-t border-line">
      <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-4">
        RECENTLY VIEWED · 你最近看過
      </p>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {items.map((it) => (
          <Link
            key={it.productId}
            href={`/shop/${it.slug}`}
            className="group flex-shrink-0 w-32 sm:w-40"
          >
            <div className="aspect-square bg-cream-100 border border-line rounded-md overflow-hidden mb-2">
              {it.imagePath && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl(it.imagePath)}
                  alt={it.nameZh}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
              )}
            </div>
            <p className="text-xs leading-snug line-clamp-2 group-hover:text-accent transition-colors">
              {it.nameZh}
            </p>
            <p className="text-xs text-ink-soft mt-0.5">{formatTwd(it.priceTwd)}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
