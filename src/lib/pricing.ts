/**
 * 代購售價公式（與 docs/PRICING_FORMULA.md 對齊）。
 * 客戶端與後台都使用同一份。
 */

export type PriceCategory =
  | 'baby_apparel'
  | 'baby_essentials'
  | 'pet_food'
  | 'pet_supplies'
  | 'limited'

export const PRICE_CATEGORIES: Array<{ value: PriceCategory; label: string; rate: number }> = [
  { value: 'baby_apparel', label: '母嬰服飾', rate: 0.30 },
  { value: 'baby_essentials', label: '母嬰用品', rate: 0.35 },
  { value: 'pet_food', label: '寵物食品', rate: 0.25 },
  { value: 'pet_supplies', label: '寵物用品', rate: 0.30 },
  { value: 'limited', label: '限定品 / 排隊品', rate: 0.45 },
]

const BOT_BUFFER = 1.02
const MIN_GROSS_TWD = 80
const DEFAULT_BOT_RATE = 0.225

export function profitRate(category: PriceCategory): number {
  return PRICE_CATEGORIES.find((c) => c.value === category)?.rate ?? 0.30
}

export function shippingFee(weightG: number, mode: 'sea' | 'air' = 'sea'): number {
  if (weightG < 500) return mode === 'sea' ? 80 : 150
  if (weightG < 1000) return mode === 'sea' ? 130 : 260
  if (weightG < 3000) return mode === 'sea' ? 250 : 500
  if (weightG < 5000) return mode === 'sea' ? 400 : 800
  return -1 // > 5kg 個案
}

export function serviceFee(priceJpy: number): number {
  if (priceJpy < 1500) return 50
  if (priceJpy < 5000) return 80
  if (priceJpy < 15000) return 150
  return 250
}

export function rounding(twd: number): number {
  // 四捨五入到最近級距（與 docs/PRICING_FORMULA.md §7 範例一致）
  if (twd < 1000) return Math.round(twd / 10) * 10
  if (twd < 5000) return Math.round(twd / 50) * 50
  return Math.round(twd / 100) * 100
}

export interface PricingInput {
  priceJpy: number
  weightG: number
  category: PriceCategory
  shippingMode?: 'sea' | 'air'
  /** 台銀現金賣出價，乘上 BOT_BUFFER 才是 systemRate */
  botRate?: number
}

export interface PricingBreakdown {
  systemRate: number
  costFromJpy: number
  shippingFee: number
  serviceFee: number
  subtotal: number
  profitRate: number
  beforeRounding: number
  finalTwd: number
  meetsMinGross: boolean
  /** 若超過 5kg，shippingFee = -1 + needsManualQuote = true */
  needsManualQuote: boolean
}

export function calculatePrice(input: PricingInput): PricingBreakdown {
  const botRate = input.botRate ?? DEFAULT_BOT_RATE
  const systemRate = +(botRate * BOT_BUFFER).toFixed(4)

  const costFromJpy = +(input.priceJpy * systemRate).toFixed(2)
  const ship = shippingFee(input.weightG, input.shippingMode ?? 'sea')
  const service = serviceFee(input.priceJpy)
  const needsManualQuote = ship < 0

  if (needsManualQuote) {
    return {
      systemRate,
      costFromJpy,
      shippingFee: 0,
      serviceFee: service,
      subtotal: 0,
      profitRate: profitRate(input.category),
      beforeRounding: 0,
      finalTwd: 0,
      meetsMinGross: false,
      needsManualQuote: true,
    }
  }

  const subtotal = costFromJpy + ship + service
  const margin = profitRate(input.category)
  const beforeRounding = +(subtotal * (1 + margin)).toFixed(2)
  const candidate = rounding(beforeRounding)

  const grossProfit = candidate - subtotal
  const finalTwd = grossProfit < MIN_GROSS_TWD ? rounding(subtotal + MIN_GROSS_TWD) : candidate

  return {
    systemRate,
    costFromJpy,
    shippingFee: ship,
    serviceFee: service,
    subtotal: +subtotal.toFixed(2),
    profitRate: margin,
    beforeRounding,
    finalTwd,
    meetsMinGross: finalTwd - subtotal >= MIN_GROSS_TWD,
    needsManualQuote: false,
  }
}
