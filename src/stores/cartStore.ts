'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, CartTotals } from '@/types/cart'

interface CartState {
  items: CartItem[]
  hasHydrated: boolean
  add: (item: Omit<CartItem, 'quantity'>, qty?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  remove: (productId: string) => void
  clear: () => void
  totals: () => CartTotals
}

/**
 * Validate a single persisted item. Returns null when any required field
 * is missing or wrong type — callers should drop the item.
 */
function isValidCartItem(x: unknown): x is CartItem {
  if (!x || typeof x !== 'object') return false
  const it = x as Record<string, unknown>
  return (
    typeof it.productId === 'string' &&
    typeof it.slug === 'string' &&
    typeof it.nameZh === 'string' &&
    typeof it.priceTwd === 'number' &&
    typeof it.weightG === 'number' &&
    typeof it.quantity === 'number' &&
    Number.isFinite(it.priceTwd) &&
    Number.isFinite(it.weightG) &&
    Number.isFinite(it.quantity) &&
    it.quantity > 0 &&
    (it.imagePath === null || typeof it.imagePath === 'string') &&
    (it.stockType === 'preorder' || it.stockType === 'in_stock')
  )
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,

      add: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + qty }
                  : i
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: qty }] }
        }),

      setQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) =>
                  i.productId === productId ? { ...i, quantity } : i
                ),
        })),

      remove: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      clear: () => set({ items: [] }),

      totals: () => {
        const items = get().items
        const subtotal = items.reduce((sum, i) => sum + i.priceTwd * i.quantity, 0)
        const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
        const totalWeightG = items.reduce((sum, i) => sum + i.weightG * i.quantity, 0)
        return { subtotal, itemCount, totalWeightG }
      },
    }),
    {
      name: 'nihon-select-cart',
      version: 2,
      // Drop persisted state when shape is corrupted or version differs;
      // start fresh rather than crash the cart page.
      migrate: (persisted) => {
        if (!persisted || typeof persisted !== 'object') {
          return { items: [], hasHydrated: false }
        }
        const p = persisted as { items?: unknown }
        const arr = Array.isArray(p.items) ? p.items : []
        return {
          items: arr.filter(isValidCartItem),
          hasHydrated: false,
        }
      },
      // Belt + suspenders: also re-validate on every merge in case a future
      // shape change slips through.
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== 'object') return current
        const p = persisted as { items?: unknown }
        const arr = Array.isArray(p.items) ? p.items : []
        return {
          ...current,
          items: arr.filter(isValidCartItem),
        }
      },
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true
      },
    }
  )
)
