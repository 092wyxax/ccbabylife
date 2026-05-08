'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface CategoryItem {
  slug: string
  name: string
}

interface Props {
  categories: CategoryItem[]
  activeCategory?: string
  activeStock?: 'preorder' | 'in_stock'
  searchQuery?: string
}

/**
 * Bottom-sheet filter UI for /shop on mobile. Replaces the chip-row visually
 * (chip row stays for desktop). Shows active filter count badge on the trigger.
 */
export function MobileFilterSheet({
  categories,
  activeCategory,
  activeStock,
  searchQuery,
}: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Build URLs preserving the search query
  const qParam = searchQuery ? `q=${encodeURIComponent(searchQuery)}` : ''
  const buildUrl = (cat?: string, stock?: 'preorder' | 'in_stock') => {
    const parts: string[] = []
    if (cat) parts.push(`category=${cat}`)
    if (stock) parts.push(`stock=${stock}`)
    if (qParam) parts.push(qParam)
    return '/shop' + (parts.length ? `?${parts.join('&')}` : '')
  }

  const activeCount = (activeCategory ? 1 : 0) + (activeStock ? 1 : 0)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden text-sm bg-white border border-line rounded-md px-4 py-2 flex items-center gap-2 hover:border-ink"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="6" y1="12" x2="18" y2="12" />
          <line x1="9" y1="18" x2="15" y2="18" />
        </svg>
        篩選
        {activeCount > 0 && (
          <span className="bg-accent text-cream text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="篩選"
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-50 bg-black/50 flex items-end animate-[fadeIn_150ms_ease-out]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-cream rounded-t-2xl w-full max-h-[85vh] overflow-y-auto flex flex-col shadow-2xl"
            style={{ animation: 'slideUp 250ms ease-out' }}
          >
            <div className="sticky top-0 bg-cream border-b border-line px-5 py-4 flex items-center justify-between">
              <h2 className="font-serif text-lg">篩選商品</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="關閉"
                className="text-ink-soft hover:text-ink text-2xl leading-none w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <div className="px-5 py-5 space-y-7 flex-1">
              <section>
                <h3 className="font-jp text-xs tracking-[0.2em] text-ink-soft mb-3">
                  CATEGORY · 商品分類
                </h3>
                <div className="flex flex-wrap gap-2">
                  <SheetChip
                    href={buildUrl(undefined, activeStock)}
                    active={!activeCategory}
                    label="全部"
                    onClick={() => setOpen(false)}
                  />
                  {categories.map((c) => (
                    <SheetChip
                      key={c.slug}
                      href={buildUrl(c.slug, activeStock)}
                      active={activeCategory === c.slug}
                      label={c.name}
                      onClick={() => setOpen(false)}
                    />
                  ))}
                </div>
              </section>

              <section>
                <h3 className="font-jp text-xs tracking-[0.2em] text-ink-soft mb-3">
                  STOCK · 庫存
                </h3>
                <div className="flex flex-wrap gap-2">
                  <SheetChip
                    href={buildUrl(activeCategory, undefined)}
                    active={!activeStock}
                    label="全部"
                    onClick={() => setOpen(false)}
                  />
                  <SheetChip
                    href={buildUrl(activeCategory, 'preorder')}
                    active={activeStock === 'preorder'}
                    label="予約 · 預購"
                    onClick={() => setOpen(false)}
                  />
                  <SheetChip
                    href={buildUrl(activeCategory, 'in_stock')}
                    active={activeStock === 'in_stock'}
                    label="在庫 · 現貨"
                    onClick={() => setOpen(false)}
                  />
                </div>
              </section>
            </div>

            {activeCount > 0 && (
              <div className="border-t border-line p-4 sticky bottom-0 bg-cream">
                <Link
                  href={buildUrl()}
                  onClick={() => setOpen(false)}
                  className="block text-center text-sm text-ink-soft hover:text-danger underline"
                >
                  清除全部篩選
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function SheetChip({
  href,
  active,
  label,
  onClick,
}: {
  href: string
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={
        'text-sm px-4 py-2 rounded-full border transition-colors ' +
        (active
          ? 'bg-ink text-cream border-ink'
          : 'border-line text-ink-soft hover:border-ink hover:text-ink')
      }
    >
      {label}
    </Link>
  )
}
