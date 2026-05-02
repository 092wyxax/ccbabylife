import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allow multi-image uploads. Each image is capped at 5 MB by Supabase
      // Storage; this limit is the total form payload, so 6 images of 5 MB
      // each comfortably fit.
      bodySizeLimit: '40mb',
    },
  },
}

export default nextConfig
