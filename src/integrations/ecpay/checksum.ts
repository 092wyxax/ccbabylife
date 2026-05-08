import 'server-only'
import { createHash } from 'crypto'

/**
 * ECPay CheckMacValue algorithm (SHA256 variant, the modern one ECPay uses
 * for AIO checkout, logistics, and invoice APIs).
 *
 * Steps:
 *  1. Sort params alphabetically by key (case-insensitive ascii)
 *  2. Join: HashKey=...&k1=v1&...&kN=vN&HashIV=...
 *  3. URL-encode the whole string (.NET style — uses %20 not '+')
 *  4. Lowercase
 *  5. Replace ECPay's specific chars back to original (.NET HttpUtility quirks)
 *  6. SHA-256 → uppercase hex
 *
 * Reference: ECPay all-in-one API doc, AioCheckOut V5 §4.
 */
export function buildCheckMacValue(
  params: Record<string, string | number | undefined | null>,
  hashKey: string,
  hashIv: string
): string {
  // Filter out undefined/null and stringify, exclude CheckMacValue itself
  const entries: Array<[string, string]> = []
  for (const [k, v] of Object.entries(params)) {
    if (k === 'CheckMacValue') continue
    if (v === undefined || v === null) continue
    entries.push([k, String(v)])
  }
  // Sort by key (case-insensitive)
  entries.sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()))

  const joined =
    `HashKey=${hashKey}&` +
    entries.map(([k, v]) => `${k}=${v}`).join('&') +
    `&HashIV=${hashIv}`

  // .NET HttpUtility.UrlEncode style (lowercase, %20 for space)
  let encoded = encodeURIComponent(joined).toLowerCase()
  // ECPay's documented replacements — keep these chars as-is
  encoded = encoded
    .replace(/%2d/g, '-')
    .replace(/%5f/g, '_')
    .replace(/%2e/g, '.')
    .replace(/%21/g, '!')
    .replace(/%2a/g, '*')
    .replace(/%28/g, '(')
    .replace(/%29/g, ')')

  return createHash('sha256').update(encoded).digest('hex').toUpperCase()
}

/**
 * Verify an incoming callback by reconstructing CheckMacValue and comparing.
 * Returns true if the param set is authentic.
 */
export function verifyCheckMacValue(
  params: Record<string, string>,
  hashKey: string,
  hashIv: string
): boolean {
  const incoming = params.CheckMacValue
  if (!incoming) return false
  const computed = buildCheckMacValue(params, hashKey, hashIv)
  return incoming.toUpperCase() === computed
}
