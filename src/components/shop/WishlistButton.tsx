'use client'

import { useWishlistStore, type WishlistItem } from '@/stores/wishlistStore'
import { toast } from '@/components/shared/Toast'

interface Props {
  item: Omit<WishlistItem, 'addedAt'>
  /** Visual variant: 'icon' for small overlay (cards), 'button' for PDP */
  variant?: 'icon' | 'button'
}

export function WishlistButton({ item, variant = 'icon' }: Props) {
  const has = useWishlistStore((s) => s.has(item.productId))
  const toggle = useWishlistStore((s) => s.toggle)

  function onClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const added = toggle(item)
    toast.success(added ? '已加入收藏 ❤' : '已從收藏移除', 1500)
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={
          'w-12 h-12 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ' +
          (has
            ? 'bg-danger/10 border-danger/40 text-danger'
            : 'bg-white border-line text-ink-soft hover:border-ink hover:text-ink')
        }
        aria-label={has ? '取消收藏' : '加入收藏'}
      >
        <Heart filled={has} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={has ? '取消收藏' : '加入收藏'}
      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-cream/90 backdrop-blur border border-line flex items-center justify-center hover:bg-ink hover:border-ink hover:text-cream transition-colors"
    >
      <Heart filled={has} />
    </button>
  )
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={filled ? 'text-danger' : ''}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}
