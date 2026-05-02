'use client'

import { useMemo, useState } from 'react'
import {
  PRICE_CATEGORIES,
  calculatePrice,
  type PriceCategory,
  type PricingBreakdown,
} from '@/lib/pricing'
import { formatTwd, formatJpy } from '@/lib/format'

export function PriceCalculator() {
  const [priceJpy, setPriceJpy] = useState('')
  const [weightG, setWeightG] = useState('')
  const [category, setCategory] = useState<PriceCategory>('baby_essentials')
  const [shippingMode, setShippingMode] = useState<'sea' | 'air'>('sea')

  const result = useMemo<PricingBreakdown | null>(() => {
    const jpy = Number(priceJpy)
    const w = Number(weightG)
    if (!jpy || !w || jpy < 0 || w < 0) return null
    return calculatePrice({ priceJpy: jpy, weightG: w, category, shippingMode })
  }, [priceJpy, weightG, category, shippingMode])

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      <div className="space-y-5 bg-white border border-line rounded-lg p-6">
        <h2 className="font-serif text-lg">商品資訊</h2>

        <div>
          <label htmlFor="priceJpy" className="block text-sm mb-1.5">
            日本售價（日圓）
          </label>
          <input
            id="priceJpy"
            type="number"
            min={0}
            value={priceJpy}
            onChange={(e) => setPriceJpy(e.target.value)}
            placeholder="例：980"
            className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
          />
        </div>

        <div>
          <label htmlFor="weightG" className="block text-sm mb-1.5">
            商品重量（公克）
          </label>
          <input
            id="weightG"
            type="number"
            min={0}
            value={weightG}
            onChange={(e) => setWeightG(e.target.value)}
            placeholder="例：200（不含包裝可加估 50g）"
            className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm mb-1.5">
            商品類別
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as PriceCategory)}
            className="w-full border border-line rounded-md px-3 py-2 bg-white focus:outline-none focus:border-ink"
          >
            {PRICE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}（利潤 {Math.round(c.rate * 100)}%）
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="block text-sm mb-1.5">運送方式</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShippingMode('sea')}
              className={
                'flex-1 border rounded-md py-2 text-sm transition-colors ' +
                (shippingMode === 'sea'
                  ? 'bg-ink text-cream border-ink'
                  : 'border-line text-ink-soft hover:border-ink')
              }
            >
              海運（約 14 天）
            </button>
            <button
              type="button"
              onClick={() => setShippingMode('air')}
              className={
                'flex-1 border rounded-md py-2 text-sm transition-colors ' +
                (shippingMode === 'air'
                  ? 'bg-ink text-cream border-ink'
                  : 'border-line text-ink-soft hover:border-ink')
              }
            >
              空運（約 7 天）
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {!result && (
          <div className="bg-cream-100 border border-line rounded-lg p-8 text-center text-ink-soft text-sm">
            填入日本售價與商品重量後，這邊會即時顯示估價。
          </div>
        )}

        {result?.needsManualQuote && (
          <div className="bg-warning/15 border border-warning/40 rounded-lg p-6 text-sm">
            <p className="font-medium mb-1">超過 5 公斤，需個案估算</p>
            <p className="text-ink-soft">
              請直接傳商品連結到我們的 LINE，30 分鐘內人工回覆精準報價。
            </p>
          </div>
        )}

        {result && !result.needsManualQuote && (
          <div className="bg-white border border-line rounded-lg overflow-hidden">
            <div className="bg-ink text-cream p-6 text-center">
              <p className="text-xs tracking-widest uppercase opacity-70 mb-2">
                估算售價
              </p>
              <p className="font-serif text-4xl">{formatTwd(result.finalTwd)}</p>
            </div>

            <div className="p-6 space-y-3 text-sm">
              <Row label="日幣金額" value={formatJpy(Number(priceJpy))} />
              <Row
                label={`匯率（含 2% 緩衝）`}
                value={`× ${result.systemRate}`}
              />
              <Row label="日幣折台幣" value={formatTwd(result.costFromJpy)} />
              <Divider />
              <Row label="國際運費" value={formatTwd(result.shippingFee)} />
              <Row label="服務費" value={formatTwd(result.serviceFee)} />
              <Row label="小計" value={formatTwd(result.subtotal)} bold />
              <Divider />
              <Row
                label={`利潤率（${PRICE_CATEGORIES.find((c) => c.value === category)?.label}）`}
                value={`× ${(1 + result.profitRate).toFixed(2)}`}
              />
              <Row label="進位前" value={formatTwd(result.beforeRounding)} />
              <Divider />
              <Row label="估算售價" value={formatTwd(result.finalTwd)} bold />
            </div>

            <div className="bg-cream-100 border-t border-line p-4 text-xs text-ink-soft leading-relaxed">
              此為**估算價格**，正式下單以官網商品頁公告為準。匯率 / 國際運費為動態，每週調整。
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-soft">{label}</span>
      <span className={bold ? 'font-medium' : ''}>{value}</span>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-line" />
}
