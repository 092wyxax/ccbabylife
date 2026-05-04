'use client'

import Script from 'next/script'

declare global {
  interface Window {
    turnstile?: {
      render: (selector: string | HTMLElement, options: Record<string, unknown>) => string
    }
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export function Turnstile() {
  if (!SITE_KEY) return null
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
        async
        defer
      />
      <div
        className="cf-turnstile"
        data-sitekey={SITE_KEY}
        data-theme="light"
        data-size="flexible"
      />
    </>
  )
}
