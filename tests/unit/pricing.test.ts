import { describe, it, expect } from 'vitest'
import {
  calculatePrice,
  serviceFee,
  shippingFee,
  rounding,
  profitRate,
} from '@/lib/pricing'

describe('pricing helpers', () => {
  it('serviceFee tiers', () => {
    expect(serviceFee(980)).toBe(50)
    expect(serviceFee(1500)).toBe(80)
    expect(serviceFee(4999)).toBe(80)
    expect(serviceFee(5000)).toBe(150)
    expect(serviceFee(20000)).toBe(250)
  })

  it('shippingFee weight tiers (sea)', () => {
    expect(shippingFee(80)).toBe(80)
    expect(shippingFee(500)).toBe(130)
    expect(shippingFee(2000)).toBe(250)
    expect(shippingFee(4000)).toBe(400)
    expect(shippingFee(6000)).toBe(-1)
  })

  it('rounding tiers', () => {
    expect(rounding(387)).toBe(390)
    expect(rounding(1237)).toBe(1250)
    expect(rounding(5234)).toBe(5200)
    expect(rounding(5251)).toBe(5300)
  })

  it('profitRate by category', () => {
    expect(profitRate('baby_apparel')).toBe(0.3)
    expect(profitRate('baby_essentials')).toBe(0.35)
    expect(profitRate('pet_food')).toBe(0.25)
    expect(profitRate('limited')).toBe(0.45)
  })
})

describe('calculatePrice — PRICING_FORMULA.md examples', () => {
  it('Pigeon 紗布巾 ¥980, 200g, baby_essentials → NT$480', () => {
    const r = calculatePrice({
      priceJpy: 980,
      weightG: 200,
      category: 'baby_essentials',
    })
    expect(r.systemRate).toBeCloseTo(0.2295, 4)
    expect(r.shippingFee).toBe(80)
    expect(r.serviceFee).toBe(50)
    expect(r.finalTwd).toBe(480)
    expect(r.needsManualQuote).toBe(false)
    expect(r.meetsMinGross).toBe(true)
  })

  it('寵物乾糧 ¥3,800, 2kg, pet_food → NT$1,500', () => {
    const r = calculatePrice({
      priceJpy: 3800,
      weightG: 2000,
      category: 'pet_food',
    })
    expect(r.shippingFee).toBe(250)
    expect(r.serviceFee).toBe(80)
    expect(r.finalTwd).toBe(1500)
  })

  it('over 5 kg returns needsManualQuote', () => {
    const r = calculatePrice({
      priceJpy: 5000,
      weightG: 6000,
      category: 'baby_essentials',
    })
    expect(r.needsManualQuote).toBe(true)
    expect(r.finalTwd).toBe(0)
  })

  it('low margin item gets bumped to MIN_GROSS_TWD', () => {
    // small cheap item where 30% margin < 80 NT
    const r = calculatePrice({
      priceJpy: 200,
      weightG: 50,
      category: 'baby_apparel',
    })
    expect(r.finalTwd - r.subtotal).toBeGreaterThanOrEqual(80)
  })
})
