'use client'

import { useState } from 'react'
import { useCartStore } from '@/stores/cartStore'
import type { CartItem } from '@/types/cart'

interface Props {
  item: Omit<CartItem, 'quantity'>
  outOfStock?: boolean
}

export function AddToCartButton({ item, outOfStock }: Props) {
  const add = useCartStore((s) => s.add)
  const [added, setAdded] = useState(false)

  const handleClick = () => {
    if (outOfStock) return
    add(item, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  if (outOfStock) {
    return (
      <button
        type="button"
        disabled
        className="w-full bg-line text-ink-soft py-4 rounded-full cursor-not-allowed"
      >
        售完
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        'w-full text-cream py-4 rounded-full transition-colors ' +
        (added ? 'bg-success' : 'bg-ink hover:bg-accent')
      }
    >
      {added ? '✓ 已加入購物車' : '加入購物車'}
    </button>
  )
}
