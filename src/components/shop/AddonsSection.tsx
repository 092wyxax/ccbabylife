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
    <section className="mt-8 p-5 bg-blush-soft/40 border border-blush/30 rounded-lg">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-jp text-xs tracking-[0.2em] text-seal mb-1">
            BUNDLE · 經常一起被買
          </p>
          <h3 className="font-serif text-lg">加購省更多</h3>
        </div>
        {addons.length > 1 && (
          <button
            type="button"
            onClick={() => {
              for (const a of addons) {
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
              if (typeof window !== 'undefined') {
                import('@/components/shared/Toast').then(({ toast }) =>
                  toast.success(`已加入 ${addons.length} 件加購商品`, 1800)
                )
              }
            }}
            className="font-jp text-xs bg-ink text-cream px-3 py-2 rounded-md hover:bg-accent tracking-[0.15em] whitespace-nowrap"
          >
            全部加入
          </button>
        )}
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
