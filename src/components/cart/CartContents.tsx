'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/stores/cartStore'
import { imageUrl } from '@/lib/image'
import { formatTwd } from '@/lib/format'

export function CartContents() {
  const [mounted, setMounted] = useState(false)
  const items = useCartStore((s) => s.items)
  const setQuantity = useCartStore((s) => s.setQuantity)
  const remove = useCartStore((s) => s.remove)
  const clear = useCartStore((s) => s.clear)
  const totals = useCartStore((s) => s.totals)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="text-ink-soft text-sm py-12 text-center">載入購物車⋯</div>
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center text-ink-soft border border-dashed border-line rounded-lg">
        購物車是空的。 <Link href="/shop" className="underline hover:text-accent">逛逛選物</Link>
      </div>
    )
  }

  const t = totals()

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8">
      <div className="space-y-4">
        {items.map((it) => (
          <div
            key={it.productId}
            className="flex items-start gap-4 bg-white border border-line rounded-lg p-4"
          >
            <div className="w-20 h-20 flex-shrink-0 bg-cream-100 rounded-md overflow-hidden">
              {it.imagePath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl(it.imagePath)} alt={it.nameZh} className="w-full h-full object-cover" />
              ) : null}
            </div>

            <div className="flex-1 min-w-0">
              <Link href={`/shop/${it.slug}`} className="hover:text-accent text-sm">
                {it.nameZh}
              </Link>
              <p className="text-xs text-ink-soft mt-0.5">
                {it.stockType === 'preorder' ? '預購' : '現貨'} · {formatTwd(it.priceTwd)} / 件
              </p>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center border border-line rounded-md">
                  <button
                    type="button"
                    onClick={() => setQuantity(it.productId, it.quantity - 1)}
                    className="w-8 h-8 hover:bg-cream-100"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm">{it.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(it.productId, it.quantity + 1)}
                    className="w-8 h-8 hover:bg-cream-100"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(it.productId)}
                  className="text-xs text-ink-soft hover:text-danger"
                >
                  移除
                </button>
              </div>
            </div>

            <div className="text-right">
              <p className="font-medium">{formatTwd(it.priceTwd * it.quantity)}</p>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={clear}
          className="text-xs text-ink-soft hover:text-danger underline"
        >
          清空購物車
        </button>
      </div>

      <aside className="bg-white border border-line rounded-lg p-6 h-fit sticky top-20">
        <h2 className="font-serif text-lg mb-4">訂單摘要</h2>

        <div className="space-y-2 text-sm border-b border-line pb-4 mb-4">
          <div className="flex justify-between">
            <span className="text-ink-soft">商品數量</span>
            <span>{t.itemCount} 件</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-soft">商品總重</span>
            <span>{(t.totalWeightG / 1000).toFixed(2)} kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-soft">商品小計</span>
            <span>{formatTwd(t.subtotal)}</span>
          </div>
        </div>

        <p className="text-xs text-ink-soft mb-4 leading-relaxed">
          結帳時將計算實際國際運費（依重量），並寄送 LINE 通知。預購商品依當週批次出貨，
          約 10–14 天到貨。
        </p>

        <Link
          href="/checkout"
          className="block w-full text-center bg-ink text-cream py-3 rounded-md hover:bg-accent transition-colors"
        >
          前往結帳
        </Link>

        <Link
          href="/shop"
          className="block mt-3 text-center text-xs text-ink-soft hover:text-accent"
        >
          ← 繼續選購
        </Link>
      </aside>
    </div>
  )
}
