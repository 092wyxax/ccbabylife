/**
 * Run once: pnpm tsx scripts/generate-vapid-keys.ts
 * Outputs VAPID public + private keys. Set them as Vercel env vars:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY = (public)
 *   VAPID_PRIVATE_KEY            = (private)
 *   VAPID_SUBJECT                = mailto:you@yourdomain.com
 */
import webpush from 'web-push'

const keys = webpush.generateVAPIDKeys()
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + keys.publicKey)
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey)
console.log('VAPID_SUBJECT=mailto:you@yourdomain.com  # change me')
