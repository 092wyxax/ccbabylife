import { and, eq, gte, lte } from 'drizzle-orm'
import { db } from '@/db/client'
import { orders, customers } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireRole } from '@/server/services/AdminAuthService'
import { STATUS_LABEL } from '@/lib/order-progress'

export const dynamic = 'force-dynamic'

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET(request: Request) {
  await requireRole(['owner', 'manager', 'ops'])

  const url = new URL(request.url)
  const fromStr = url.searchParams.get('from')
  const toStr = url.searchParams.get('to')

  const conditions = [eq(orders.orgId, DEFAULT_ORG_ID)]
  if (fromStr) conditions.push(gte(orders.createdAt, new Date(fromStr)))
  if (toStr) conditions.push(lte(orders.createdAt, new Date(toStr + 'T23:59:59')))

  const rows = await db
    .select({
      orderNumber: orders.orderNumber,
      createdAt: orders.createdAt,
      status: orders.status,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      total: orders.total,
      subtotal: orders.subtotal,
      shippingFee: orders.shippingFee,
      storeCreditUsed: orders.storeCreditUsed,
      customerName: customers.name,
      customerEmail: customers.email,
      customerPhone: customers.phone,
      shippingAddress: orders.shippingAddress,
      trackingNumber: orders.trackingNumber,
      shippingProvider: orders.shippingProvider,
      shippedAt: orders.shippedAt,
      cutoffDate: orders.cutoffDate,
      expectedDelivery: orders.expectedDelivery,
      ecpayTradeNo: orders.ecpayTradeNo,
      notes: orders.notes,
    })
    .from(orders)
    .leftJoin(customers, eq(customers.id, orders.customerId))
    .where(and(...conditions))
    .orderBy(orders.createdAt)

  const headers = [
    '訂單編號',
    '建立時間',
    '狀態',
    '付款方式',
    '付款狀態',
    '小計',
    '運費',
    '購物金',
    '總計',
    '客戶姓名',
    '客戶 Email',
    '客戶電話',
    '收件地址',
    '物流業者',
    '追蹤碼',
    '出貨時間',
    '截單日',
    '預計到貨',
    '綠界交易號',
    '備註',
  ]

  const lines: string[] = [headers.join(',')]
  for (const r of rows) {
    const addr = r.shippingAddress
      ? `${r.shippingAddress.zipcode} ${r.shippingAddress.city}${r.shippingAddress.address} (${r.shippingAddress.recipientName} ${r.shippingAddress.phone})`
      : ''
    lines.push(
      [
        r.orderNumber,
        new Date(r.createdAt).toISOString().slice(0, 19).replace('T', ' '),
        STATUS_LABEL[r.status as keyof typeof STATUS_LABEL] ?? r.status,
        r.paymentMethod ?? '',
        r.paymentStatus,
        r.subtotal,
        r.shippingFee,
        r.storeCreditUsed,
        r.total,
        r.customerName ?? '',
        r.customerEmail ?? '',
        r.customerPhone ?? '',
        addr,
        r.shippingProvider ?? '',
        r.trackingNumber ?? '',
        r.shippedAt ? new Date(r.shippedAt).toISOString().slice(0, 19).replace('T', ' ') : '',
        r.cutoffDate ?? '',
        r.expectedDelivery ?? '',
        r.ecpayTradeNo ?? '',
        r.notes ?? '',
      ]
        .map(csvEscape)
        .join(',')
    )
  }

  // BOM so Excel handles UTF-8 correctly
  const csv = '﻿' + lines.join('\n')
  const filename = `orders-${new Date().toISOString().slice(0, 10)}.csv`

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
