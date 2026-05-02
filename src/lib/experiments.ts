/**
 * Pure helpers for variant assignment. Hash the visitor ID + experiment key
 * so each visitor gets a sticky variant without DB writes on every page view.
 */

export interface VariantSpec {
  key: string
  label: string
  weight: number
}

export const VISITOR_COOKIE = 'nihon_visitor'

function hashString(input: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = (h * 0x01000193) >>> 0
  }
  return h >>> 0
}

/**
 * Deterministic variant pick. Same (visitor, experiment) → always same variant.
 */
export function pickVariant(
  visitorId: string,
  experimentKey: string,
  variants: VariantSpec[]
): VariantSpec {
  if (variants.length === 0) {
    throw new Error('No variants defined')
  }
  const totalWeight = variants.reduce((s, v) => s + v.weight, 0)
  if (totalWeight <= 0) return variants[0]

  const h = hashString(`${experimentKey}:${visitorId}`)
  const slot = h % totalWeight

  let cumulative = 0
  for (const v of variants) {
    cumulative += v.weight
    if (slot < cumulative) return v
  }
  return variants[variants.length - 1]
}

export function generateVisitorId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
