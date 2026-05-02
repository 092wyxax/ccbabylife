import { describe, it, expect } from 'vitest'
import { validateCoupon } from '@/lib/coupon-validation'
import type { Coupon } from '@/db/schema/coupons'

function mkCoupon(p: Partial<Coupon> = {}): Coupon {
  return {
    id: '00000000-0000-0000-0000-000000000000',
    orgId: '00000000-0000-0000-0000-000000000001',
    code: 'TEST',
    type: 'fixed',
    value: 100,
    minOrderTwd: 0,
    maxUses: null,
    usedCount: 0,
    expiresAt: null,
    isActive: true,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...p,
  }
}

describe('validateCoupon', () => {
  it('rejects inactive', () => {
    const r = validateCoupon(mkCoupon({ isActive: false }), 1000)
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/停用/)
  })

  it('rejects expired', () => {
    const r = validateCoupon(
      mkCoupon({ expiresAt: new Date('2020-01-01') }),
      1000
    )
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/過期/)
  })

  it('rejects when usage cap reached', () => {
    const r = validateCoupon(mkCoupon({ maxUses: 5, usedCount: 5 }), 1000)
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/使用上限/)
  })

  it('rejects when subtotal below minOrderTwd', () => {
    const r = validateCoupon(mkCoupon({ minOrderTwd: 1000 }), 500)
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/1000/)
  })

  it('fixed amount discount', () => {
    const r = validateCoupon(mkCoupon({ type: 'fixed', value: 100 }), 500)
    expect(r.ok).toBe(true)
    expect(r.discountAmount).toBe(100)
  })

  it('percent discount uses floor', () => {
    const r = validateCoupon(mkCoupon({ type: 'percent', value: 10 }), 1234)
    expect(r.ok).toBe(true)
    expect(r.discountAmount).toBe(123)
  })

  it('discount cannot exceed subtotal', () => {
    const r = validateCoupon(mkCoupon({ type: 'fixed', value: 1000 }), 500)
    expect(r.ok).toBe(true)
    expect(r.discountAmount).toBe(500)
  })
})
