import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-scripts.com https://*.vercel-insights.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://fonts.gstatic.com data:",
      "connect-src 'self' https://*.supabase.co https://*.supabase.io wss://*.supabase.co https://*.vercel-insights.com https://access.line.me https://accounts.google.com",
      "frame-src 'self' https://access.line.me https://accounts.google.com",
      "form-action 'self' https://access.line.me https://accounts.google.com https://payment.ecpay.com.tw https://payment-stage.ecpay.com.tw",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.125', '192.168.*.*', '10.0.*.*'],
  experimental: {
    serverActions: {
      // Allow multi-image uploads. Each image is capped at 5 MB by Supabase
      // Storage; this limit is the total form payload, so 6 images of 5 MB
      // each comfortably fit.
      bodySizeLimit: '40mb',
    },
    // CSS View Transitions API — soft fade between routes in supported browsers
    viewTransition: true,
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

const sentryEnabled = Boolean(
  process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
)

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      widenClientFileUpload: true,
      reactComponentAnnotation: { enabled: true },
      sourcemaps: { disable: false },
      disableLogger: true,
    })
  : nextConfig
