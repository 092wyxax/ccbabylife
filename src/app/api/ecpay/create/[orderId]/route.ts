import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { orders } from '@/db/schema'
import {
  buildPaymentForm,
  defaultPaymentUrls,
  type EcpayPaymentMethod,
} from '@/integrations/ecpay/payment'
import { isEcpayConfigured } from '@/integrations/ecpay/config'

interface Params {
  orderId: string
}

const VALID: EcpayPaymentMethod[] = [
  'ALL',
  'Credit',
  'WebATM',
  'ATM',
  'CVS',
  'BARCODE',
  'ApplePay',
  'TWQR',
]

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<Params> }
) {
  const { orderId } = await ctx.params

  if (!isEcpayConfigured()) {
    return new NextResponse('ECPay not configured', { status: 503 })
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
  if (!order) return new NextResponse('Order not found', { status: 404 })
  if (order.status !== 'pending_payment') {
    return new NextResponse('Order not awaiting payment', { status: 400 })
  }

  // Optional method override via form field
  const formData = await req.formData().catch(() => null)
  const method = formData?.get('method')
  const paymentType = (typeof method === 'string' && VALID.includes(method as EcpayPaymentMethod))
    ? (method as EcpayPaymentMethod)
    : 'ALL'

  const urls = defaultPaymentUrls(order.id)
  const form = buildPaymentForm({
    merchantTradeNo: order.orderNumber,
    totalAmount: order.total,
    itemName: `熙熙初日 訂單 ${order.orderNumber}`,
    tradeDesc: `Order ${order.orderNumber}`,
    paymentType,
    returnUrl: urls.returnUrl,
    clientBackUrl: urls.clientBackUrl,
  })

  // Render auto-submitting HTML
  const inputs = Object.entries(form.fields)
    .map(
      ([k, v]) =>
        `<input type="hidden" name="${escapeAttr(k)}" value="${escapeAttr(v)}" />`
    )
    .join('\n')

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>跳轉至綠界⋯</title></head>
<body style="font-family:sans-serif;text-align:center;padding:40px">
<p>正在跳轉至綠界金流，請稍候⋯</p>
<form id="ecpayForm" action="${form.url}" method="POST">${inputs}</form>
<script>document.getElementById('ecpayForm').submit();</script>
</body></html>`

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
