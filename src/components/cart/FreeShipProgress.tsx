'use client'

import { useCartStore } from '@/stores/cartStore'
import { FREE_SHIP_THRESHOLD_TWD } from '@/lib/pricing'
import { formatTwd } from '@/lib/format'

interface Props {
  /** Override the global threshold (e.g., from member tier) */
  thresholdTwd?: number
  className?: string
}

export function FreeShipProgress({ thresholdTwd, className = '' }: Props) {
  const items = useCartStore((s) => s.items)
  const subtotal = items.reduce((s, i) => s + i.priceTwd * i.quantity, 0)
  const goal = thresholdTwd ?? FREE_SHIP_THRESHOLD_TWD

  if (items.length === 0) return null

  const reached = subtotal >= goal
  const remaining = Math.max(0, goal - subtotal)
  const pct = Math.min(100, Math.round((subtotal / goal) * 100))

  return (
    <div className={`bg-cream-100 border border-line rounded-lg p-3 ${className}`}>
      {reached ? (
        <p className="text-sm">
          🎉 <strong>免運達成！</strong>
          <span className="text-ink-soft ml-1">運費已歸 0</span>
        </p>
      ) : (
        <p className="text-sm">
          再加 <strong className="text-accent">{formatTwd(remaining)}</strong> 享免運 🚚
        </p>
      )}
      <div className="h-1.5 bg-line rounded-full mt-2 overflow-hidden">
        <div
          className={`h-full transition-all ${reached ? 'bg-success' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
