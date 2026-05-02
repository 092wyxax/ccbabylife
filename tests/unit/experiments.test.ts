import { describe, it, expect } from 'vitest'
import { pickVariant, type VariantSpec } from '@/lib/experiments'

const VARIANTS: VariantSpec[] = [
  { key: 'A', label: 'Control', weight: 50 },
  { key: 'B', label: 'Treatment', weight: 50 },
]

describe('pickVariant', () => {
  it('is deterministic for same visitor + experiment', () => {
    const a = pickVariant('visitor-1', 'exp-1', VARIANTS)
    const b = pickVariant('visitor-1', 'exp-1', VARIANTS)
    expect(a.key).toBe(b.key)
  })

  it('different visitors can land in different variants', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 100; i++) {
      const v = pickVariant(`visitor-${i}`, 'exp-1', VARIANTS)
      seen.add(v.key)
    }
    expect(seen.size).toBeGreaterThanOrEqual(2)
  })

  it('respects weight (90/10)', () => {
    const variants: VariantSpec[] = [
      { key: 'A', label: '', weight: 90 },
      { key: 'B', label: '', weight: 10 },
    ]
    let countA = 0
    const N = 5000
    for (let i = 0; i < N; i++) {
      const v = pickVariant(`v-${i}`, 'weight-test', variants)
      if (v.key === 'A') countA++
    }
    const ratio = countA / N
    // Expect ~0.9 with reasonable tolerance
    expect(ratio).toBeGreaterThan(0.85)
    expect(ratio).toBeLessThan(0.95)
  })

  it('falls back to first variant when total weight is 0', () => {
    const v = pickVariant('x', 'k', [
      { key: 'X', label: '', weight: 0 },
      { key: 'Y', label: '', weight: 0 },
    ])
    expect(v.key).toBe('X')
  })
})
