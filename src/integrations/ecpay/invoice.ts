import 'server-only'
import { createCipheriv, createDecipheriv, createHash } from 'crypto'
import { ecpayMode, endpoints } from './config'

/**
 * ECPay B2C 電子發票 v3 API。
 *
 * 與金流/物流不同，B2C 發票走「JSON + AES-128-CBC 加密」格式，認證用
 * 另一組 ECPAY_INVOICE_* env vars（非金流的 hashKey/iv）。
 *
 * Sandbox 用 ECPay 提供的測試帳號：
 *   ECPAY_INVOICE_MERCHANT_ID = '2000132'
 *   ECPAY_INVOICE_HASH_KEY    = 'ejCk326UnaZWKisg'
 *   ECPAY_INVOICE_HASH_IV     = 'q9jcZX8Ib9LM8wYk'
 */

const SANDBOX = {
  merchantId: '2000132',
  hashKey: 'ejCk326UnaZWKisg',
  hashIv: 'q9jcZX8Ib9LM8wYk',
}

interface InvoiceCreds {
  merchantId: string
  hashKey: string
  hashIv: string
}

function invoiceCreds(): InvoiceCreds {
  if (ecpayMode() === 'production') {
    const m = process.env.ECPAY_INVOICE_MERCHANT_ID
    const k = process.env.ECPAY_INVOICE_HASH_KEY
    const v = process.env.ECPAY_INVOICE_HASH_IV
    if (!m || !k || !v) {
      throw new Error('ECPay invoice credentials missing in production env')
    }
    return { merchantId: m, hashKey: k, hashIv: v }
  }
  return {
    merchantId: process.env.ECPAY_INVOICE_MERCHANT_ID || SANDBOX.merchantId,
    hashKey: process.env.ECPAY_INVOICE_HASH_KEY || SANDBOX.hashKey,
    hashIv: process.env.ECPAY_INVOICE_HASH_IV || SANDBOX.hashIv,
  }
}

export function isInvoiceConfigured(): boolean {
  if (ecpayMode() === 'production') {
    return Boolean(
      process.env.ECPAY_INVOICE_MERCHANT_ID &&
        process.env.ECPAY_INVOICE_HASH_KEY &&
        process.env.ECPAY_INVOICE_HASH_IV
    )
  }
  return true
}

// ──────────── AES-128-CBC + URL-encode (ECPay's quirky encoding) ──────────

function urlEncodeNet(s: string): string {
  return encodeURIComponent(s)
    .replace(/%20/g, '+')
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2a')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
}

function aesEncrypt(plaintext: string, key: string, iv: string): string {
  const encoded = urlEncodeNet(plaintext)
  const cipher = createCipheriv('aes-128-cbc', Buffer.from(key, 'utf8'), Buffer.from(iv, 'utf8'))
  cipher.setAutoPadding(true)
  return Buffer.concat([cipher.update(encoded, 'utf8'), cipher.final()]).toString('base64')
}

function aesDecrypt(b64: string, key: string, iv: string): string {
  const decipher = createDecipheriv('aes-128-cbc', Buffer.from(key, 'utf8'), Buffer.from(iv, 'utf8'))
  decipher.setAutoPadding(true)
  const buf = Buffer.concat([decipher.update(Buffer.from(b64, 'base64')), decipher.final()])
  return decodeURIComponent(buf.toString('utf8'))
}

// ──────────── Issue invoice ──────────

export interface IssueInvoiceItem {
  itemName: string
  itemCount: number
  itemWord: string // 個 / 件 / 份
  itemPrice: number
  itemAmount: number // = price × count
  itemTaxType?: '1' | '2' | '3' // 1=應稅, 2=零稅率, 3=免稅
}

export interface IssueInvoiceInput {
  /** Your internal order id; must be ≤ 30 chars, ASCII */
  relateNumber: string
  /** Buyer name (個人填收件人姓名；公司行號填統編公司名稱) */
  customerName: string
  customerEmail?: string
  customerPhone?: string
  /** 統一編號（公司行號才有；個人留空） */
  customerIdentifier?: string
  /** 載具：手機條碼 / 自然人憑證 / 會員（用 email） */
  carrierType?: '0' | '1' | '2' | '3'
  carrierNum?: string
  /** 捐贈：給定 LoveCode 即觸發捐贈，無需 customer 載具 */
  donation?: boolean
  loveCode?: string
  /** 列印（B2B 統編需印） */
  print?: '0' | '1'
  taxType?: '1' | '2' | '3' | '9'
  salesAmount: number // 含稅總額
  items: IssueInvoiceItem[]
  invType?: '07' | '08' // 07=一般稅額, 08=特種
}

export interface IssueInvoiceResult {
  ok: boolean
  invoiceNumber?: string
  randomNumber?: string
  message: string
  raw: unknown
}

export async function issueInvoice(input: IssueInvoiceInput): Promise<IssueInvoiceResult> {
  const creds = invoiceCreds()
  const url = endpoints().invoice

  const data = {
    MerchantID: creds.merchantId,
    RelateNumber: input.relateNumber.slice(0, 30),
    CustomerName: input.customerName.slice(0, 60),
    CustomerEmail: input.customerEmail ?? '',
    CustomerPhone: input.customerPhone ?? '',
    CustomerIdentifier: input.customerIdentifier ?? '',
    Print: input.print ?? (input.customerIdentifier ? '1' : '0'),
    Donation: input.donation ? '1' : '0',
    LoveCode: input.loveCode ?? '',
    CarrierType: input.donation ? '' : (input.carrierType ?? ''),
    CarrierNum: input.donation ? '' : (input.carrierNum ?? ''),
    TaxType: input.taxType ?? '1',
    SalesAmount: input.salesAmount,
    InvType: input.invType ?? '07',
    Items: input.items.map((it, i) => ({
      ItemSeq: i + 1,
      ItemName: it.itemName,
      ItemCount: it.itemCount,
      ItemWord: it.itemWord,
      ItemPrice: it.itemPrice,
      ItemTaxType: it.itemTaxType ?? '1',
      ItemAmount: it.itemAmount,
    })),
  }

  const encrypted = aesEncrypt(JSON.stringify(data), creds.hashKey, creds.hashIv)
  const body = {
    MerchantID: creds.merchantId,
    RqHeader: {
      Timestamp: Math.floor(Date.now() / 1000),
    },
    Data: encrypted,
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (json.TransCode !== 1) {
      return { ok: false, message: json.TransMsg ?? 'unknown', raw: json }
    }
    const decrypted = aesDecrypt(json.Data, creds.hashKey, creds.hashIv)
    const decoded = JSON.parse(decrypted)
    if (decoded.RtnCode !== 1) {
      return { ok: false, message: decoded.RtnMsg ?? 'invoice rejected', raw: decoded }
    }
    return {
      ok: true,
      invoiceNumber: decoded.InvoiceNo,
      randomNumber: decoded.RandomNumber,
      message: 'OK',
      raw: decoded,
    }
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : String(e),
      raw: null,
    }
  }
}

// ──────────── Sandbox stub helper for testing without real ECPay ────────

export function sandboxStubInvoice(input: IssueInvoiceInput): IssueInvoiceResult {
  return {
    ok: true,
    invoiceNumber: 'AB' + String(Math.floor(Math.random() * 1e8)).padStart(8, '0'),
    randomNumber: String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
    message: 'sandbox stub',
    raw: { stub: true, input },
  }
}

export { aesEncrypt, aesDecrypt, urlEncodeNet, createHash }
