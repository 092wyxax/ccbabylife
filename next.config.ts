import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.125', '192.168.*.*', '10.0.*.*'],
  experimental: {
    serverActions: {
      // Allow multi-image uploads. Each image is capped at 5 MB by Supabase
      // Storage; this limit is the total form payload, so 6 images of 5 MB
      // each comfortably fit.
      bodySizeLimit: '40mb',
    },
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
