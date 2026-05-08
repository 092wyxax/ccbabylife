'use client'

import { useEffect, useRef } from 'react'
import { useCartStore } from '@/stores/cartStore'
import { snapshotCartAction } from '@/server/actions/cart-snapshot'
import type { CartItem } from '@/types/cart'

/**
 * Mounted once site-wide (in the public layout). Watches the client cart and
 * pushes a debounced server-side snapshot so we can run abandonment recovery.
 * No-op for guests (server action exits early without a customer session).
 */
export function CartSyncBridge() {
  const items = useCartStore((s) => s.items)
  const hydrated = useCartStore((s) => s.hasHydrated)
  const lastSync = useRef<string>('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!hydrated) return
    const key = JSON.stringify(items.map((i: CartItem) => `${i.productId}:${i.quantity}`))
    if (key === lastSync.current) return

    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      lastSync.current = key
      snapshotCartAction(items).catch(() => {
        /* swallow — analytics, not critical */
      })
    }, 1500)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [items, hydrated])

  return null
}
