import { pgTable, uuid, text, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { orders } from './orders'

/**
 * 電子發票紀錄。一張訂單可能有多筆紀錄（開立 / 折讓 / 作廢）。
 *  - issued: 已開立成功
 *  - failed: 開立失敗（看 errorMessage）
 *  - voided: 已作廢
 *  - allowance: 折讓單
 */
export const invoiceStatusEnum = ['issued', 'failed', 'voided', 'allowance'] as const
export type InvoiceStatus = (typeof invoiceStatusEnum)[number]

export const invoiceCarrierTypeEnum = [
  'none', // 列印紙本（不寫入載具）
  'mobile_barcode', // /XXXXXXX 手機條碼
  'natural_person_certificate', // AB12345678901234 自然人憑證
  'member', // 會員載具（綁 email）
] as const
export type InvoiceCarrierType = (typeof invoiceCarrierTypeEnum)[number]

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    /** ECPay invoice number returned (e.g. AB12345678) — null if failed */
    invoiceNumber: text('invoice_number'),
    /** Random 4-digit code printed on invoice */
    randomNumber: text('random_number'),
    status: text('status', { enum: invoiceStatusEnum }).notNull(),
    /** Total invoice amount (incl. tax) — usually = order.total */
    totalAmount: integer('total_amount').notNull(),
    /** Snapshot of buyer details at issue time */
    buyerName: text('buyer_name'),
    buyerEmail: text('buyer_email'),
    /** 統一編號（公司戶才有；自然人 null） */
    buyerTaxId: text('buyer_tax_id'),
    carrierType: text('carrier_type', { enum: invoiceCarrierTypeEnum }).notNull().default('none'),
    carrierNum: text('carrier_num'),
    /** 'donate' = 捐贈，loveCode = 受贈單位捐贈碼 */
    donationLoveCode: text('donation_love_code'),
    issuedAt: timestamp('issued_at', { withTimezone: true }),
    voidedAt: timestamp('voided_at', { withTimezone: true }),
    voidReason: text('void_reason'),
    /** ECPay raw response for audit */
    rawResponse: jsonb('raw_response'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('invoices_order_idx').on(table.orderId),
    index('invoices_number_idx').on(table.invoiceNumber),
  ]
)

export type Invoice = typeof invoices.$inferSelect
export type NewInvoice = typeof invoices.$inferInsert
