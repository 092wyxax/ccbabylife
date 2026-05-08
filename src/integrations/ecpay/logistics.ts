import 'server-only'
import { ecpayCreds, endpoints, siteUrl, ecpayMode } from './config'
import { buildCheckMacValue } from './checksum'

export type CvsType =
  | 'UNIMARTC2C' // 7-11
  | 'FAMIC2C' // 全家
  | 'HILIFEC2C' // 萊爾富
  | 'OKMARTC2C' // OK 超商

/**
 * Returns the auto-submitting HTML form params for the ECPay 電子地圖 endpoint.
 * Customer is sent to ECPay's map UI to pick a store, then ECPay POSTs the
 * selected store back to ServerReplyURL with CVSStoreID, CVSStoreName,
 * CVSAddress, etc.
 *
 * Use case: on /checkout when shippingMethod is 'cvs_*', a button opens this
 * to let user pick the pickup store.
 */
export function buildStoreMapForm(opts: {
  /** Free identifier so we can match the reply (use orderNumber if order
   *  already exists, or a temp UUID before order creation) */
  merchantTradeNo: string
  cvsType: CvsType
  /** Where ECPay POSTs the chosen store data back */
  serverReplyUrl: string
  /** Optional: where to send the user's browser back to after picking */
  extraData?: string
}): { url: string; fields: Record<string, string> } {
  const { merchantId, hashKey, hashIv } = ecpayCreds()
  const url = endpoints().logisticsMap

  const params: Record<string, string | number> = {
    MerchantID: merchantId,
    MerchantTradeNo: opts.merchantTradeNo.slice(0, 20),
    LogisticsType: 'CVS',
    LogisticsSubType: opts.cvsType,
    IsCollection: 'N', // 不貨到付款
    ServerReplyURL: opts.serverReplyUrl,
    ExtraData: opts.extraData ?? '',
    Device: 0, // 0 PC, 1 Mobile
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

/**
 * Create a logistics order on ECPay (server-side) once order is paid + ready
 * to ship. Returns the AllPayLogisticsID + payment-no (for label printing).
 *
 * NOTE: This is a server-to-server call (not browser). Schema scaffold; the
 * actual sender info (warehouse address, sender name, phone) needs your
 * real warehouse data — populate via env vars before going live.
 */
export interface CreateLogisticsInput {
  merchantTradeNo: string
  goodsAmount: number
  goodsName: string
  senderName: string
  senderPhone: string
  receiverName: string
  receiverPhone: string
  receiverEmail: string
  cvsType: CvsType
  cvsStoreId: string
}

export async function createCvsShipment(
  input: CreateLogisticsInput
): Promise<{ ok: true; logisticsId: string; raw: string } | { ok: false; error: string }> {
  if (ecpayMode() !== 'production' && !process.env.ECPAY_LOGISTICS_FORCE_LIVE) {
    // Sandbox stub — return a fake id for UI testing
    return {
      ok: true,
      logisticsId: `SANDBOX-${Date.now()}`,
      raw: 'sandbox stub',
    }
  }

  const { merchantId, hashKey, hashIv } = ecpayCreds()
  const url = endpoints().logistics

  const params: Record<string, string | number> = {
    MerchantID: merchantId,
    MerchantTradeNo: input.merchantTradeNo.slice(0, 20),
    MerchantTradeDate: formatTaipeiNow(),
    LogisticsType: 'CVS',
    LogisticsSubType: input.cvsType,
    GoodsAmount: input.goodsAmount,
    GoodsName: input.goodsName.slice(0, 50),
    SenderName: input.senderName,
    SenderCellPhone: input.senderPhone,
    ReceiverName: input.receiverName,
    ReceiverCellPhone: input.receiverPhone,
    ReceiverEmail: input.receiverEmail,
    ServerReplyURL: `${siteUrl()}/api/ecpay/logistics/callback`,
    ReceiverStoreID: input.cvsStoreId,
    IsCollection: 'N',
  }
  const CheckMacValue = buildCheckMacValue(params, hashKey, hashIv)

  const body = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    CheckMacValue,
  })

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const text = await res.text()
    // ECPay returns key=value&key=value
    const result = Object.fromEntries(new URLSearchParams(text))
    if (result.RtnCode === '300') {
      return { ok: true, logisticsId: result.AllPayLogisticsID ?? '', raw: text }
    }
    return { ok: false, error: result.RtnMsg ?? text }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

function formatTaipeiNow(): string {
  const now = new Date()
  const tpe = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60_000)
  return `${tpe.getFullYear()}/${String(tpe.getMonth() + 1).padStart(2, '0')}/${String(
    tpe.getDate()
  ).padStart(2, '0')} ${String(tpe.getHours()).padStart(2, '0')}:${String(
    tpe.getMinutes()
  ).padStart(2, '0')}:${String(tpe.getSeconds()).padStart(2, '0')}`
}

export const CVS_LABELS: Record<CvsType, string> = {
  UNIMARTC2C: '7-ELEVEN 取貨',
  FAMIC2C: '全家便利商店',
  HILIFEC2C: '萊爾富',
  OKMARTC2C: 'OK 超商',
}

const PRINT_URLS = {
  sandbox: 'https://logistics-stage.ecpay.com.tw/Express/PrintTradeDocument',
  production: 'https://logistics.ecpay.com.tw/Express/PrintTradeDocument',
}

/**
 * Build the auto-submit form for ECPay's "託運單列印" page.
 * Caller renders an HTML form that POSTs to ECPay; ECPay returns a printable
 * page (NOT a PDF — admin clicks browser-print to physical printer).
 */
export function buildPrintLabelForm(opts: {
  allPayLogisticsId: string
  cvsPaymentNo?: string // 7-11 / 全家 needs this
  cvsValidationNo?: string // 7-11 needs this
}): { url: string; fields: Record<string, string> } {
  const { merchantId, hashKey, hashIv } = ecpayCreds()
  const url = PRINT_URLS[ecpayMode()]

  const params: Record<string, string | number> = {
    MerchantID: merchantId,
    AllPayLogisticsID: opts.allPayLogisticsId,
  }
  if (opts.cvsPaymentNo) params.CVSPaymentNo = opts.cvsPaymentNo
  if (opts.cvsValidationNo) params.CVSValidationNo = opts.cvsValidationNo

  const CheckMacValue = buildCheckMacValue(params, hashKey, hashIv)

  return {
    url,
    fields: {
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
      CheckMacValue,
    },
  }
}
