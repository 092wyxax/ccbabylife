'use client'

import { useCartStore } from '@/stores/cartStore'
import { formatTwd } from '@/lib/format'

interface AddonItem {
  addonId: string
  productId: string
  slug: string
  nameZh: string
  originalPrice: number
  addonPrice: number
  weightG: number
  stockType: 'preorder' | 'in_stock'
  maxAddonQty: number
}

interface Props {
  addons: AddonItem[]
}

export function AddonsSection({ addons }: Props) {
  const add = useCartStore((s) => s.add)

  return (
    <section className="mt-8 p-5 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="mb-3">
        <p className="font-jp text-xs tracking-[0.2em] text-amber-700 mb-1">
          ADD-ON · 加購商品
        </p>
        <h3 className="font-serif text-lg">加購省更多 🎁</h3>
      </div>

      <div className="space-y-2">
        {addons.map((a) => {
          const saved = a.originalPrice - a.addonPrice
          const savedPct = a.originalPrice > 0
            ? Math.round((saved / a.originalPrice) * 100)
            : 0
          return (
            <div
              key={a.addonId}
              className="flex items-center justify-between bg-white rounded-md border border-amber-200/60 p-3 gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{a.nameZh}</p>
                <p className="text-xs text-ink-soft mt-0.5">
                  <span className="line-through mr-2">{formatTwd(a.originalPrice)}</span>
                  <span className="text-accent font-medium">{formatTwd(a.addonPrice)}</span>
                  {saved > 0 && (
                    <span className="ml-2 bg-accent/10 text-accent text-[10px] px-1.5 py-0.5 rounded">
                      省 {savedPct}%
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  add({
                    productId: a.productId,
                    slug: a.slug,
                    nameZh: a.nameZh,
                    priceTwd: a.addonPrice,
                    weightG: a.weightG,
                    imagePath: null,
                    stockType: a.stockType,
                  })
                }
                className="font-jp text-xs bg-amber-600 text-white px-3 py-1.5 rounded-md hover:bg-amber-700 tracking-wider whitespace-nowrap"
              >
                加購
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
