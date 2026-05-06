/**
 * 採購單計算邏輯 — 共用於前端即時試算 + 後端儲存 snapshot。
 *
 * 所有金額單位 = 新台幣整數元 (round)。
 * 比率欄位 = basis points × 100（i.e. percent × 100）。
 *   12% = 1200, 0.04% = 4, 5% = 500
 * 匯率欄位 = rate × 100000（5 decimal）。0.21359 = 21359
 */

export const PROMO_FEE_RATE_BP = 4 // 推廣貿易服務費 0.04%
export const VAT_RATE_BP = 500 // 進口營業稅 5%

export type PriceRoundStrategy = 'A' | 'B' | 'C' | 'D'

export interface PurchaseHeader {
  exchangeRateScaled: number
  agentBaseFeeTwd: number
  agentHandlingFeeTwd: number
  clearanceFeeAmountTwd: number
  packagingFeeTotal: number
  markupRateBp: number
  priceRoundStrategy: 'A' | 'B' | 'C' | 'D'
}

export interface PurchaseItemInput {
  qty: number
  jpyUnitPrice: number
  /** 該商品稅率分組的稅率 (BP) */
  importDutyRateBp: number
}

export interface PurchaseItemCalc {
  jpySubtotal: number
  twdSubtotal: number
  importDuty: number
  promoFee: number
  vat: number
  clearanceFeeShare: number
  packagingFeeShare: number
  agentFeeShare: number
  itemCost: number
  landedCostPerUnit: number
  suggestedPriceRaw: number
  suggestedPrice: number
  marginPerUnit: number
  marginTotal: number
}

export interface PurchaseTotals {
  totalUnits: number
  jpyTotal: number
  twdTotal: number
  totalImportDuty: number
  totalPromoFee: number
  totalVat: number
  totalClearance: number
  totalPackaging: number
  totalAgent: number
  totalCost: number
  suggestedRevenue: number
  totalMargin: number
  marginRatePct: number
}

export function calcPurchase(
  header: PurchaseHeader,
  items: PurchaseItemInput[]
): { items: PurchaseItemCalc[]; totals: PurchaseTotals } {
  const totalUnits = items.reduce((s, it) => s + Math.max(0, it.qty), 0)
  const safeUnits = totalUnits || 1

  // 1. 進貨金額（每行）
  const itemBase = items.map((it) => {
    const jpySubtotal = Math.max(0, it.qty) * Math.max(0, it.jpyUnitPrice)
    const twdSubtotal = Math.round(
      (jpySubtotal * Math.max(0, header.exchangeRateScaled)) / 100000
    )
    return { jpySubtotal, twdSubtotal }
  })

  // 2. 共用分攤額（總額 ÷ 件數，每行平均）
  const clearanceShareEach = Math.round(
    Math.max(0, header.clearanceFeeAmountTwd) / safeUnits
  )
  const packagingShareEach = Math.round(
    Math.max(0, header.packagingFeeTotal) / safeUnits
  )
  const agentTotal =
    Math.max(0, header.agentBaseFeeTwd) + Math.max(0, header.agentHandlingFeeTwd)
  const agentShareEach = Math.round(agentTotal / safeUnits)

  // 3. 每行詳細計算
  const calcs: PurchaseItemCalc[] = items.map((it, i) => {
    const { jpySubtotal, twdSubtotal } = itemBase[i]

    const importDuty = Math.round(
      (twdSubtotal * Math.max(0, it.importDutyRateBp)) / 10000
    )
    const promoFee = Math.round((twdSubtotal * PROMO_FEE_RATE_BP) / 10000)
    const vat = Math.round(
      ((twdSubtotal + importDuty + promoFee) * VAT_RATE_BP) / 10000
    )

    const qty = Math.max(0, it.qty)
    const clearanceFeeShare = clearanceShareEach * qty
    const packagingFeeShare = packagingShareEach * qty
    const agentFeeShare = agentShareEach * qty

    const itemCost =
      twdSubtotal +
      importDuty +
      promoFee +
      vat +
      clearanceFeeShare +
      packagingFeeShare +
      agentFeeShare

    const landedCostPerUnit = qty > 0 ? Math.round(itemCost / qty) : 0
    const suggestedPriceRaw = Math.round(
      (landedCostPerUnit * (10000 + Math.max(0, header.markupRateBp))) / 10000
    )
    const suggestedPrice = roundPrice(suggestedPriceRaw, header.priceRoundStrategy)

    const marginPerUnit = suggestedPrice - landedCostPerUnit
    const marginTotal = marginPerUnit * qty

    return {
      jpySubtotal,
      twdSubtotal,
      importDuty,
      promoFee,
      vat,
      clearanceFeeShare,
      packagingFeeShare,
      agentFeeShare,
      itemCost,
      landedCostPerUnit,
      suggestedPriceRaw,
      suggestedPrice,
      marginPerUnit,
      marginTotal,
    }
  })

  // 4. 匯總
  const sum = (key: keyof PurchaseItemCalc) =>
    calcs.reduce((s, c) => s + (c[key] as number), 0)

  const jpyTotal = calcs.reduce((s, c) => s + c.jpySubtotal, 0)
  const twdTotal = calcs.reduce((s, c) => s + c.twdSubtotal, 0)
  const totalCost = calcs.reduce((s, c) => s + c.itemCost, 0)
  const suggestedRevenue = calcs.reduce(
    (s, c, i) => s + c.suggestedPrice * Math.max(0, items[i].qty),
    0
  )
  const totalMargin = suggestedRevenue - totalCost
  const marginRatePct =
    totalCost > 0 ? Math.round((totalMargin * 1000) / totalCost) / 10 : 0

  return {
    items: calcs,
    totals: {
      totalUnits,
      jpyTotal,
      twdTotal,
      totalImportDuty: sum('importDuty'),
      totalPromoFee: sum('promoFee'),
      totalVat: sum('vat'),
      totalClearance: sum('clearanceFeeShare'),
      totalPackaging: sum('packagingFeeShare'),
      totalAgent: sum('agentFeeShare'),
      totalCost,
      suggestedRevenue,
      totalMargin,
      marginRatePct,
    },
  }
}

/**
 * 美化售價 — 4 種策略。
 * - A: 尾數 9 (159 / 249 / 1249)
 * - B: 取最接近 50 倍數
 * - C: 取最接近 100 倍數
 * - D: 智慧混合 — 小金額 X9、中金額 X50/X00、大金額 X00/X50
 */
export function roundPrice(raw: number, strategy: 'A' | 'B' | 'C' | 'D'): number {
  if (raw <= 0) return 0
  switch (strategy) {
    case 'A':
      return roundToEnd9(raw)
    case 'B':
      return roundToNearest(raw, 50)
    case 'C':
      return roundToNearest(raw, 100)
    case 'D':
      if (raw < 500) return roundToEnd9(raw)
      if (raw < 2000) return roundToNearest(raw, 50)
      return roundToNearest(raw, 100)
  }
}

function roundToEnd9(n: number): number {
  if (n < 10) return n
  // 找最接近的 X9 (X9, X19, X29...)
  // n=651 → 659 / n=637 → 639 / n=632 → 629
  const tens = Math.floor(n / 10) * 10
  const candidates = [tens - 1, tens + 9, tens + 19]
  return candidates.reduce(
    (best, c) =>
      c > 0 && Math.abs(c - n) < Math.abs(best - n) ? c : best,
    candidates[1]
  )
}

function roundToNearest(n: number, base: number): number {
  return Math.round(n / base) * base
}
