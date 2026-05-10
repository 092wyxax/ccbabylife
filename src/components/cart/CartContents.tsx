'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/stores/cartStore'
import { useWishlistStore } from '@/stores/wishlistStore'
import { toast } from '@/components/shared/Toast'
import { imageUrl } from '@/lib/image'
import { formatTwd } from '@/lib/format'
import { GiftProgress } from './GiftProgress'
import { EmptyCartIllustration } from '@/components/shared/BrandIllustrations'
import { FreeShipProgress } from './FreeShipProgress'
import { CrossSell } from './CrossSell'

export function CartContents() {
  const [mounted, setMounted] = useState(false)
  const items = useCartStore((s) => s.items)
  const setQuantity = useCartStore((s) => s.setQuantity)
  const remove = useCartStore((s) => s.remove)
  const clear = useCartStore((s) => s.clear)
  const totals = useCartStore((s) => s.totals)

  // Don't subscribe via a selector that returns a fresh closure every
  // render — that produces a new reference each call which makes
  // useSyncExternalStore think the snapshot changed, triggering an
  // infinite render loop under React 19. Read the store imperatively
  // inside the handler instead.
  const saveForLater = (item: {
    productId: string
    slug: string
    nameZh: string
    priceTwd: number
    imagePath: string | null
  }) => {
    const s = useWishlistStore.getState()
    if (!s.has(item.productId)) s.toggle(item)
  }

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="text-ink-soft text-sm py-12 text-center">
        <span className="font-jp tracking-wider">お待ちください・・・</span>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="text-seal flex justify-center mb-5">
          <EmptyCartIllustration className="w-44 h-32" />
        </div>
        <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">
          EMPTY · 空っぽ
        </p>
        <h2 className="font-serif text-xl mb-3 tracking-wide">購物車是空的</h2>
        <p className="text-ink-soft text-sm mb-6">還沒有挑到喜歡的東西嗎？</p>
        <Link
          href="/shop"
          className="font-jp inline-block bg-ink text-cream px-6 py-3 rounded-md hover:bg-accent transition-colors tracking-[0.15em] text-sm"
        >
          去逛逛選物
        </Link>
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
                <span className="font-jp tracking-wider">
                  {it.stockType === 'preorder' ? '予約' : '在庫'}
                </span>
                {' · '}
                {formatTwd(it.priceTwd)} / 點
              </p>

              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <div className="flex items-center border border-line rounded-md bg-white">
                  <button
                    type="button"
                    aria-label="減少 1"
                    onClick={() => setQuantity(it.productId, it.quantity - 1)}
                    className="w-10 h-10 sm:w-9 sm:h-9 hover:bg-cream-100 flex items-center justify-center text-base"
                  >
                    −
                  </button>
                  <span className="w-10 sm:w-9 text-center text-sm font-medium">
                    {it.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="增加 1"
                    onClick={() => setQuantity(it.productId, it.quantity + 1)}
                    className="w-10 h-10 sm:w-9 sm:h-9 hover:bg-cream-100 flex items-center justify-center text-base"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    saveForLater({
                      productId: it.productId,
                      slug: it.slug,
                      nameZh: it.nameZh,
                      priceTwd: it.priceTwd,
                      imagePath: it.imagePath,
                    })
                    remove(it.productId)
                    toast.info(`已移到收藏：${it.nameZh}`, 1500)
                  }}
                  className="text-xs text-ink-soft hover:text-ink underline-offset-2 hover:underline"
                >
                  ❤ 移到收藏
                </button>
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

        <FreeShipProgress />
        <GiftProgress />
        <CrossSell />

        <p className="text-xs text-ink-soft mb-4 leading-relaxed">
          結帳時將計算實際運費（依重量），並寄送 LINE 通知。預購商品依當週批次出貨，
          約 10–14 天到貨。
        </p>

        <Link
          href="/checkout"
          className="font-jp block w-full text-center bg-ink text-cream py-3 rounded-md hover:bg-accent transition-colors tracking-wider"
        >
          ご注文手続きへ · 前往結帳
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
