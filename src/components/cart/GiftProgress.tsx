'use client'

import { useEffect, useState } from 'react'
import { useCartStore } from '@/stores/cartStore'
import {
  fetchActiveGiftsAction,
  type PublicGift,
} from '@/server/actions/threshold-gifts-public'
import { formatTwd } from '@/lib/format'

export function GiftProgress() {
  const items = useCartStore((s) => s.items)
  const [gifts, setGifts] = useState<PublicGift[]>([])
  const subtotal = items.reduce((s, i) => s + i.priceTwd * i.quantity, 0)

  useEffect(() => {
    fetchActiveGiftsAction().then(setGifts).catch(() => setGifts([]))
  }, [])

  if (gifts.length === 0 || items.length === 0) return null

  const sortedGifts = [...gifts].sort((a, b) => a.thresholdTwd - b.thresholdTwd)
  const earned = sortedGifts.filter((g) => subtotal >= g.thresholdTwd)
  const next = sortedGifts.find((g) => g.thresholdTwd > subtotal)

  return (
    <div className="bg-blush-soft/50 border border-blush/30 rounded-lg p-4 mb-4">
      {earned.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-jp tracking-[0.25em] text-seal mb-1.5">
            GIFTS UNLOCKED · 已達標
          </p>
          {earned.map((g) => (
            <p key={g.id} className="text-sm text-ink mt-0.5 flex items-start gap-2">
              <span className="text-sage mt-0.5" aria-hidden>✓</span>
              <span>
                <strong>{g.giftProductName}</strong> × {g.quantity}{' '}
                <span className="text-ink-soft">將在出貨時附贈</span>
              </span>
            </p>
          ))}
        </div>
      )}

      {next && (
        <div>
          <p className="text-xs text-ink-soft mb-2">
            還差 <strong className="font-serif text-accent">{formatTwd(next.thresholdTwd - subtotal)}</strong>{' '}
            就送 <strong>{next.giftProductName}</strong>
          </p>
          <div className="h-1 bg-cream rounded-full overflow-hidden">
            <div
              className="h-full bg-blush transition-all duration-500"
              style={{
                width: `${Math.min(100, (subtotal / next.thresholdTwd) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
