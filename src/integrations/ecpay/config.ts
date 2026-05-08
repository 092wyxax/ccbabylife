import 'server-only'

/** Switch sandbox vs production from env. Sandbox uses ECPay's test endpoints
 *  with their public test merchant credentials when ours are not set.
 *  Set ECPAY_MODE=production in Vercel once your real merchant ID + keys
 *  pass ECPay's review.
 */
export type EcpayMode = 'sandbox' | 'production'

export function ecpayMode(): EcpayMode {
  return process.env.ECPAY_MODE === 'production' ? 'production' : 'sandbox'
}

interface EcpayCreds {
  merchantId: string
  hashKey: string
  hashIv: string
}

// ECPay's documented sandbox credentials (everyone uses these for testing)
const SANDBOX_DEFAULTS: EcpayCreds = {
  merchantId: '3002607',
  hashKey: 'pwFHCqoQZGmho4w6',
  hashIv: 'EkRm7iFT261dpevs',
}

export function ecpayCreds(): EcpayCreds {
  if (ecpayMode() === 'production') {
    const merchantId = process.env.ECPAY_MERCHANT_ID
    const hashKey = process.env.ECPAY_HASH_KEY
    const hashIv = process.env.ECPAY_HASH_IV
    if (!merchantId || !hashKey || !hashIv) {
      throw new Error(
        'ECPay production credentials missing: set ECPAY_MERCHANT_ID, ECPAY_HASH_KEY, ECPAY_HASH_IV'
      )
    }
    return { merchantId, hashKey, hashIv }
  }
  return {
    merchantId: process.env.ECPAY_MERCHANT_ID || SANDBOX_DEFAULTS.merchantId,
    hashKey: process.env.ECPAY_HASH_KEY || SANDBOX_DEFAULTS.hashKey,
    hashIv: process.env.ECPAY_HASH_IV || SANDBOX_DEFAULTS.hashIv,
  }
}

export const ECPAY_ENDPOINTS = {
  sandbox: {
    payment: 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5',
    logistics: 'https://logistics-stage.ecpay.com.tw/Express/Create',
    logisticsMap: 'https://logistics-stage.ecpay.com.tw/Express/map',
    invoice: 'https://einvoice-stage.ecpay.com.tw/B2CInvoice/Issue',
  },
  production: {
    payment: 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5',
    logistics: 'https://logistics.ecpay.com.tw/Express/Create',
    logisticsMap: 'https://logistics.ecpay.com.tw/Express/map',
    invoice: 'https://einvoice.ecpay.com.tw/B2CInvoice/Issue',
  },
} as const

export function endpoints() {
  return ECPAY_ENDPOINTS[ecpayMode()]
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ccbabylife.com'
}

export function isEcpayConfigured(): boolean {
  if (ecpayMode() === 'production') {
    return Boolean(
      process.env.ECPAY_MERCHANT_ID &&
        process.env.ECPAY_HASH_KEY &&
        process.env.ECPAY_HASH_IV
    )
  }
  return true // sandbox always works with default creds
}
