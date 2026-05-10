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

function isValidWishlistItem(x: unknown): x is WishlistItem {
  if (!x || typeof x !== 'object') return false
  const it = x as Record<string, unknown>
  return (
    typeof it.productId === 'string' &&
    typeof it.slug === 'string' &&
    typeof it.nameZh === 'string' &&
    typeof it.priceTwd === 'number' &&
    Number.isFinite(it.priceTwd) &&
    typeof it.addedAt === 'number' &&
    (it.imagePath === null || typeof it.imagePath === 'string')
  )
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
      version: 2,
      migrate: (persisted) => {
        if (!persisted || typeof persisted !== 'object') {
          return { items: [], hasHydrated: false }
        }
        const p = persisted as { items?: unknown }
        const arr = Array.isArray(p.items) ? p.items : []
        return {
          items: arr.filter(isValidWishlistItem),
          hasHydrated: false,
        }
      },
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== 'object') return current
        const p = persisted as { items?: unknown }
        const arr = Array.isArray(p.items) ? p.items : []
        return {
          ...current,
          items: arr.filter(isValidWishlistItem),
        }
      },
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true
      },
    }
  )
)
