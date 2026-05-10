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
    <div className={`bg-sage-soft/40 border border-sage/20 rounded-lg p-3.5 ${className}`}>
      {reached ? (
        <p className="text-sm flex items-center gap-2">
          <span className="text-sage" aria-hidden>✓</span>
          <strong>免運達成</strong>
          <span className="text-ink-soft text-xs">· 運費已歸零</span>
        </p>
      ) : (
        <p className="text-sm">
          再加 <strong className="font-serif text-accent">{formatTwd(remaining)}</strong>{' '}
          <span className="text-ink-soft">享免運</span>
        </p>
      )}
      <div className="h-1 bg-cream rounded-full mt-2.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${reached ? 'bg-sage' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-ink-soft mt-2 leading-relaxed">
        🍼 母嬰 ＋ 🐾 寵物 同車合併計算，一次寄到家。
      </p>
    </div>
  )
}
