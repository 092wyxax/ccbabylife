import { NextResponse } from 'next/server'

/**
 * Redirect to a same-site path using a RELATIVE `Location` header.
 *
 * Behind a reverse proxy (Zeabur) the Next standalone server sees the request
 * host as the internal `0.0.0.0:8080`, so `new URL(path, request.url)` would
 * send the browser to that unreachable address. A relative Location is resolved
 * by the browser against the address-bar URL (the real public domain), so this
 * works behind any proxy and in local dev alike.
 *
 * `path` must be a root-relative path (starts with '/'), optionally with query.
 * Default status 307 matches `NextResponse.redirect` and preserves the method.
 */
export function redirectToPath(
  path: string,
  status: 302 | 303 | 307 = 307
): NextResponse {
  return new NextResponse(null, { status, headers: { Location: path } })
}
