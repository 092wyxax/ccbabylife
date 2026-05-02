import 'server-only'

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterMs: number
}

/**
 * In-process token-bucket rate limit. Survives across hot-reload but NOT
 * across serverless instances. For low-traffic sites this is sufficient;
 * upgrade to Upstash Redis if traffic grows.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 }
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: bucket.resetAt - now,
    }
  }

  bucket.count++
  return {
    ok: true,
    remaining: limit - bucket.count,
    retryAfterMs: 0,
  }
}

/**
 * Pull a stable identifier from the headers. Use only inside server actions
 * or route handlers (after `headers()` is awaited).
 */
export async function getClientIp(): Promise<string> {
  const { headers } = await import('next/headers')
  const h = await headers()
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    'unknown'
  )
}
