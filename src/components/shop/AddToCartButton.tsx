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
        className="font-jp w-full bg-line text-ink-soft py-4 cursor-not-allowed tracking-wider"
      >
        完売 · 售完
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        'w-full text-cream py-4 transition-colors tracking-wide ' +
        (added ? 'bg-success' : 'bg-ink hover:bg-accent')
      }
    >
      {added ? '✓ 已加入購物車' : 'カートに入れる · 加入購物車'}
    </button>
  )
}
