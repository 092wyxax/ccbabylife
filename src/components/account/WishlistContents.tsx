'use client'

import Link from 'next/link'
import { useWishlistStore } from '@/stores/wishlistStore'
import { useCartStore } from '@/stores/cartStore'
import { toast } from '@/components/shared/Toast'
import { imageUrl } from '@/lib/image'
import { formatTwd } from '@/lib/format'

export function WishlistContents() {
  const items = useWishlistStore((s) => s.items)
  const hydrated = useWishlistStore((s) => s.hasHydrated)
  const remove = useWishlistStore((s) => s.remove)
  const clear = useWishlistStore((s) => s.clear)
  const addToCart = useCartStore((s) => s.add)

  if (!hydrated) {
    return <p className="text-ink-soft text-sm py-12 text-center">載入中⋯</p>
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center text-ink-soft border border-dashed border-line rounded-lg">
        <p className="mb-4">還沒有收藏的商品</p>
        <Link href="/shop" className="text-accent hover:underline text-sm">
          去逛逛 →
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-ink-soft">{items.length} 件商品</p>
        <button
          type="button"
          onClick={() => {
            if (confirm('確定要清空收藏？')) {
              clear()
              toast.info('已清空收藏')
            }
          }}
          className="text-xs text-ink-soft hover:text-danger underline"
        >
          清空收藏
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
        {items.map((it) => (
          <div key={it.productId} className="group relative">
            <Link href={`/shop/${it.slug}`} className="block">
              <div className="aspect-square bg-cream-100 border border-line rounded-md overflow-hidden mb-3">
                {it.imagePath && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl(it.imagePath)}
                    alt={it.nameZh}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                )}
              </div>
              <h3 className="text-sm leading-snug line-clamp-2 group-hover:text-accent">
                {it.nameZh}
              </h3>
              <p className="text-base font-medium mt-1">{formatTwd(it.priceTwd)}</p>
            </Link>

            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  addToCart(
                    {
                      productId: it.productId,
                      slug: it.slug,
                      nameZh: it.nameZh,
                      priceTwd: it.priceTwd,
                      weightG: 0,
                      imagePath: it.imagePath,
                      stockType: 'preorder',
                    },
                    1
                  )
                  toast.success(`已加入購物車：${it.nameZh}`, 1500)
                }}
                className="flex-1 text-xs font-jp bg-ink text-cream py-2 rounded-md hover:bg-accent transition-colors tracking-wider"
              >
                加入購物車
              </button>
              <button
                type="button"
                onClick={() => {
                  remove(it.productId)
                  toast.info('已從收藏移除', 1200)
                }}
                aria-label="移除收藏"
                className="text-xs text-ink-soft hover:text-danger px-2"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
