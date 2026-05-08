'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WishlistItem {
  productId: string
  slug: string
  nameZh: string
  priceTwd: number
  imagePath: string | null
  addedAt: number
}

interface WishlistState {
  items: WishlistItem[]
  hasHydrated: boolean
  has: (productId: string) => boolean
  toggle: (item: Omit<WishlistItem, 'addedAt'>) => boolean // returns new state
  remove: (productId: string) => void
  clear: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,

      has: (productId) => get().items.some((i) => i.productId === productId),

      toggle: (item) => {
        const exists = get().items.some((i) => i.productId === item.productId)
        if (exists) {
          set((state) => ({
            items: state.items.filter((i) => i.productId !== item.productId),
          }))
          return false
        }
        set((state) => ({
          items: [{ ...item, addedAt: Date.now() }, ...state.items],
        }))
        return true
      },

      remove: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: 'nihon-select-wishlist',
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true
      },
    }
  )
)
