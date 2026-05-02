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
      onRehydrateStorage: () => (state) => {
        state?.hasHydrated && (state.hasHydrated = true)
        if (state) state.hasHydrated = true
      },
    }
  )
)
