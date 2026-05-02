/**
 * Generate a short readable referral code (8 chars).
 * No 0/O/1/I to avoid ambiguity.
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateReferralCode(length = 8): string {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return out
}

export const REFERRAL_COOKIE = 'nihon_ref'
