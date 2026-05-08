import 'server-only'
import { ecpayCreds, endpoints, siteUrl } from './config'
import { buildCheckMacValue } from './checksum'

export type EcpayPaymentMethod =
  | 'ALL' // 顯示所有可用方式
  | 'Credit' // 信用卡（含分期）
  | 'WebATM'
  | 'ATM'
  | 'CVS'
  | 'BARCODE'
  | 'ApplePay'
  | 'TWQR' // LINE Pay 等行動支付（ECPay 預設用 TWQR 入口）

export interface CreatePaymentInput {
  /** Order id from your DB — used as MerchantTradeNo (must be ≤ 20 chars, ASCII) */
  merchantTradeNo: string
  /** NTD integer */
  totalAmount: number
  /** Free text description shown to user */
  itemName: string
  /** "TradeDesc" — short description, ≤ 200 chars */
  tradeDesc: string
  paymentType?: EcpayPaymentMethod
  /** Where ECPay should POST the payment result (server-to-server) */
  returnUrl: string
  /** Where ECPay redirects the customer's browser after payment */
  clientBackUrl: string
}

/**
 * Build the params + CheckMacValue ready to be POST-submitted as an HTML form
 * to ECPay's AioCheckOut endpoint. Caller renders an auto-submitting form
 * (we provide an HTML helper too).
 */
export function buildPaymentForm(input: CreatePaymentInput): {
  url: string
  fields: Record<string, string>
} {
  const { merchantId, hashKey, hashIv } = ecpayCreds()
  const url = endpoints().payment

  // ECPay needs MerchantTradeDate in "yyyy/MM/dd HH:mm:ss" Taipei time
  const tradeDate = formatTaipeiNow()

  const params: Record<string, string | number> = {
    MerchantID: merchantId,
    MerchantTradeNo: input.merchantTradeNo.replace(/[^A-Za-z0-9]/g, '').slice(0, 20),
    MerchantTradeDate: tradeDate,
    PaymentType: 'aio',
    TotalAmount: input.totalAmount,
    TradeDesc: encodeURIComponent(input.tradeDesc).slice(0, 200),
    ItemName: input.itemName.slice(0, 400),
    ReturnURL: input.returnUrl,
    ClientBackURL: input.clientBackUrl,
    OrderResultURL: input.clientBackUrl,
    ChoosePayment: input.paymentType ?? 'ALL',
    EncryptType: 1,
  }

  const CheckMacValue = buildCheckMacValue(params, hashKey, hashIv)

  return {
    url,
    fields: {
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
      CheckMacValue,
    },
  }
}

function formatTaipeiNow(): string {
  // Get current Taipei time as yyyy/MM/dd HH:mm:ss
  const now = new Date()
  const tpe = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60_000)
  const yyyy = tpe.getFullYear()
  const mm = String(tpe.getMonth() + 1).padStart(2, '0')
  const dd = String(tpe.getDate()).padStart(2, '0')
  const HH = String(tpe.getHours()).padStart(2, '0')
  const MM = String(tpe.getMinutes()).padStart(2, '0')
  const SS = String(tpe.getSeconds()).padStart(2, '0')
  return `${yyyy}/${mm}/${dd} ${HH}:${MM}:${SS}`
}

/** Build standard return / back URLs for our app */
export function defaultPaymentUrls(orderId: string) {
  const base = siteUrl()
  return {
    returnUrl: `${base}/api/ecpay/payment/callback`,
    clientBackUrl: `${base}/checkout/success?orderId=${orderId}`,
  }
}
