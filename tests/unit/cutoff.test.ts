import { describe, it, expect } from 'vitest'
import { nextCutoffDate } from '@/lib/cutoff'

function taipeiDate(iso: string): Date {
  // ISO interpreted as Taipei time -> UTC instant
  return new Date(`${iso}+08:00`)
}

describe('nextCutoffDate', () => {
  it('Wednesday returns coming Sunday 23:59 Taipei', () => {
    const wed = taipeiDate('2026-05-06T10:00:00')
    const cutoff = nextCutoffDate(wed)
    // 2026-05-10 (Sun) 23:59:59 Taipei = 15:59:59 UTC
    expect(cutoff.toISOString()).toBe('2026-05-10T15:59:59.000Z')
  })

  it('Sunday before cutoff returns same day', () => {
    const sun = taipeiDate('2026-05-10T10:00:00')
    const cutoff = nextCutoffDate(sun)
    expect(cutoff.toISOString()).toBe('2026-05-10T15:59:59.000Z')
  })

  it('Sunday after cutoff jumps to next Sunday', () => {
    const sunLate = taipeiDate('2026-05-10T23:59:30')
    const cutoff = nextCutoffDate(sunLate)
    expect(cutoff.toISOString()).toBe('2026-05-17T15:59:59.000Z')
  })
})
