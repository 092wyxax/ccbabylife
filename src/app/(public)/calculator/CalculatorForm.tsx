'use client'

import { useMemo, useState } from 'react'
import {
  calculatePrice,
  PRICE_CATEGORIES,
  type PriceCategory,
} from '@/lib/pricing'

const formatTwd = (n: number) => `NT$${Math.round(n).toLocaleString()}`
const formatJpy = (n: number) => `¥${n.toLocaleString()}`

export function CalculatorForm() {
  const [priceJpy, setPriceJpy] = useState<number>(2980)
  const [weightG, setWeightG] = useState<number>(450)
  const [category, setCategory] = useState<PriceCategory>('baby_essentials')
  const [shippingMode, setShippingMode] = useState<'sea' | 'air'>('sea')

  const result = useMemo(() => {
    if (priceJpy <= 0 || weightG < 0) return null
    return calculatePrice({ priceJpy, weightG, category, shippingMode })
  }, [priceJpy, weightG, category, shippingMode])

  return (
    <div className="bg-white border border-line rounded-lg p-6 sm:p-8 space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="priceJpy" className="block text-sm mb-1.5">
            日幣售價（含稅）
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft text-sm">
              ¥
            </span>
            <input
              id="priceJpy"
              type="number"
              min="1"
              value={priceJpy}
              onChange={(e) => setPriceJpy(Number(e.target.value) || 0)}
              className="w-full border border-line rounded-md pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-ink"
            />
          </div>
        </div>

        <div>
          <label htmlFor="weightG" className="block text-sm mb-1.5">
            重量（公克）
          </label>
          <input
            id="weightG"
            type="number"
            min="0"
            value={weightG}
            onChange={(e) => setWeightG(Number(e.target.value) || 0)}
            className="w-full border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-ink"
          />
        </div>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm mb-1.5">
          品類
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as PriceCategory)}
          className="w-full border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-ink bg-white"
        >
          {PRICE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}（毛利 {Math.round(c.rate * 100)}%）
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm mb-1.5">配送方式</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShippingMode('sea')}
            className={
              'flex-1 text-sm py-2 rounded-md border transition-colors ' +
              (shippingMode === 'sea'
                ? 'bg-ink text-cream border-ink'
                : 'border-line hover:border-ink')
            }
          >
            海運（標準）
          </button>
          <button
            type="button"
            onClick={() => setShippingMode('air')}
            className={
              'flex-1 text-sm py-2 rounded-md border transition-colors ' +
              (shippingMode === 'air'
                ? 'bg-ink text-cream border-ink'
                : 'border-line hover:border-ink')
            }
          >
            空運（加急）
          </button>
        </div>
      </div>

      {result && !result.needsManualQuote && (
        <div className="border-t border-line pt-5 mt-5 space-y-2 text-sm">
          <Row label="日幣售價" value={formatJpy(priceJpy)} />
          <Row label={`× 系統匯率 ${result.systemRate}`} value={formatTwd(result.costFromJpy)} muted />
          <Row label="國際運費" value={formatTwd(result.shippingFee)} muted />
          <Row label="服務費" value={formatTwd(result.serviceFee)} muted />
          <Row label="成本小計" value={formatTwd(result.subtotal)} />
          <Row
            label={`毛利 ${Math.round(result.profitRate * 100)}%`}
            value={`+${formatTwd(result.beforeRounding - result.subtotal)}`}
            muted
          />
          <div className="border-t border-line pt-3 mt-3 flex justify-between items-baseline">
            <span className="font-jp text-xs tracking-[0.2em] text-ink-soft">
              FINAL · 售價
            </span>
            <span className="font-serif text-2xl text-seal">
              {formatTwd(result.finalTwd)}
            </span>
          </div>
          {!result.meetsMinGross && (
            <p className="text-xs text-ink-soft pt-2">
              💡 此單毛利不足 NT$80，已自動補到最低毛利水準。
            </p>
          )}
        </div>
      )}

      {result?.needsManualQuote && (
        <div className="border-t border-line pt-5 mt-5 bg-warning/10 border border-warning/30 rounded-md p-4 text-sm">
          ⚠️ 重量超過 5kg，需個案估算運費。請私訊 LINE 客服。
        </div>
      )}
    </div>
  )
}

function Row({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className="flex justify-between items-baseline">
      <span className={muted ? 'text-ink-soft text-xs' : ''}>{label}</span>
      <span className={muted ? 'text-ink-soft text-xs font-mono' : 'font-mono'}>
        {value}
      </span>
    </div>
  )
}
