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
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
      {earned.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-jp tracking-[0.2em] text-amber-700 mb-1">
            🎁 GIFTS UNLOCKED · 已達標
          </p>
          {earned.map((g) => (
            <p key={g.id} className="text-sm text-ink mt-0.5">
              ✓ <strong>{g.giftProductName}</strong> × {g.quantity} 將在出貨時附贈
            </p>
          ))}
        </div>
      )}

      {next && (
        <div>
          <p className="text-xs text-ink-soft mb-1.5">
            還差 <strong className="text-accent">{formatTwd(next.thresholdTwd - subtotal)}</strong>{' '}
            就送 <strong>{next.giftProductName}</strong>
          </p>
          <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all"
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
