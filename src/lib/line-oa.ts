/**
 * Single source of truth for the LINE Official Account display ID and
 * "add friend" URL.
 *
 * Override via NEXT_PUBLIC_LINE_OA_ID (e.g., "@ccbabylife" once a paid
 * custom ID is purchased — until then the auto-assigned basic ID
 * "@708zsvtj" is the real one).
 */
const FALLBACK_OA_ID = '@708zsvtj'

export const LINE_OA_ID =
  process.env.NEXT_PUBLIC_LINE_OA_ID ?? FALLBACK_OA_ID

/** "https://line.me/R/ti/p/@xxx" — the universal add-friend URL. */
export const LINE_OA_URL = `https://line.me/R/ti/p/${LINE_OA_ID}`
