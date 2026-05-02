import { describe, it, expect } from 'vitest'
import { canTransition, InvalidStatusTransitionError } from '@/lib/order-state-machine'
import { orderStatusEnum } from '@/db/schema'

describe('Order state machine', () => {
  it('allows pending_payment -> paid', () => {
    expect(canTransition('pending_payment', 'paid')).toBe(true)
  })

  it('allows pending_payment -> cancelled', () => {
    expect(canTransition('pending_payment', 'cancelled')).toBe(true)
  })

  it('forbids pending_payment -> shipped', () => {
    expect(canTransition('pending_payment', 'shipped')).toBe(false)
  })

  it('forbids completed -> paid (no rewinds)', () => {
    expect(canTransition('completed', 'paid')).toBe(false)
  })

  it('allows completed -> refunded', () => {
    expect(canTransition('completed', 'refunded')).toBe(true)
  })

  it('forbids refunded -> anything', () => {
    for (const to of orderStatusEnum) {
      expect(canTransition('refunded', to)).toBe(false)
    }
  })

  it('forbids shipping_intl -> cancelled (cost is sunk)', () => {
    expect(canTransition('shipping_intl', 'cancelled')).toBe(false)
  })

  it('InvalidStatusTransitionError carries from/to', () => {
    const err = new InvalidStatusTransitionError('paid', 'shipped')
    expect(err.from).toBe('paid')
    expect(err.to).toBe('shipped')
    expect(err.message).toContain('paid -> shipped')
  })
})
