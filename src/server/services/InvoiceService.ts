import 'server-only'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { invoices, type Invoice } from '@/db/schema/invoices'
import { orders, orderItems, customers } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import {
  issueInvoice,
  sandboxStubInvoice,
  isInvoiceConfigured,
  type IssueInvoiceItem,
} from '@/integrations/ecpay/invoice'
import { ecpayMode } from '@/integrations/ecpay/config'

export async function listInvoicesForOrder(orderId: string): Promise<Invoice[]> {
  return db
    .select()
    .from(invoices)
    .where(and(eq(invoices.orgId, DEFAULT_ORG_ID), eq(invoices.orderId, orderId)))
    .orderBy(desc(invoices.createdAt))
}

export async function listInvoicesPaged(limit = 100): Promise<Invoice[]> {
  return db
    .select()
    .from(invoices)
    .where(eq(invoices.orgId, DEFAULT_ORG_ID))
    .orderBy(desc(invoices.createdAt))
    .limit(limit)
}

export interface IssueOptions {
  /** Force sandbox stub even if invoice creds present (admin testing) */
  stub?: boolean
  carrierType?: '0' | '1' | '2' | '3'
  carrierNum?: string
  donate?: boolean
  loveCode?: string
}

/**
 * Issue an invoice for a paid order. Idempotent: skips if there's already an
 * "issued" invoice. Stores the result in `invoices` table.
 */
export async function issueInvoiceForOrder(
  orderId: string,
  options: IssueOptions = {}
): Promise<Invoice> {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.orgId, DEFAULT_ORG_ID), eq(orders.id, orderId)))
    .limit(1)
  if (!order) throw new Error('Order not found')
  if (order.paymentStatus !== 'paid') {
    throw new Error('Order must be paid before invoicing')
  }

  // Already issued?
  const existing = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.orderId, orderId), eq(invoices.status, 'issued')))
    .limit(1)
  if (existing[0]) return existing[0]

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, order.customerId))
    .limit(1)

  const buyerName = order.shippingAddress?.recipientName ?? customer?.name ?? '消費者'

  const lineItems: IssueInvoiceItem[] = items.map((it) => ({
    itemName: it.productNameSnapshot.slice(0, 100),
    itemCount: it.quantity,
    itemWord: '件',
    itemPrice: it.priceTwdSnapshot,
    itemAmount: it.lineTotal,
    itemTaxType: '1',
  }))
  // Add shipping fee as separate line if non-zero
  if (order.shippingFee > 0) {
    lineItems.push({
      itemName: '運費',
      itemCount: 1,
      itemWord: '式',
      itemPrice: order.shippingFee,
      itemAmount: order.shippingFee,
      itemTaxType: '1',
    })
  }

  const input = {
    relateNumber: order.orderNumber,
    customerName: buyerName,
    customerEmail: order.recipientEmail,
    salesAmount: order.total,
    items: lineItems,
    carrierType: options.carrierType,
    carrierNum: options.carrierNum,
    donation: options.donate,
    loveCode: options.loveCode,
  }

  const useStub = options.stub || (ecpayMode() !== 'production' && !isInvoiceConfigured())
  const result = useStub ? sandboxStubInvoice(input) : await issueInvoice(input)

  const [row] = await db
    .insert(invoices)
    .values({
      orgId: DEFAULT_ORG_ID,
      orderId,
      invoiceNumber: result.invoiceNumber ?? null,
      randomNumber: result.randomNumber ?? null,
      status: result.ok ? 'issued' : 'failed',
      totalAmount: order.total,
      buyerName,
      buyerEmail: order.recipientEmail,
      carrierType:
        options.donate ? 'none'
        : options.carrierType === '1' ? 'mobile_barcode'
        : options.carrierType === '2' ? 'natural_person_certificate'
        : options.carrierType === '3' ? 'member'
        : 'none',
      carrierNum: options.carrierNum ?? null,
      donationLoveCode: options.donate ? options.loveCode ?? null : null,
      issuedAt: result.ok ? new Date() : null,
      rawResponse: result.raw as Record<string, unknown> | null,
      errorMessage: result.ok ? null : result.message,
    })
    .returning()

  return row
}
