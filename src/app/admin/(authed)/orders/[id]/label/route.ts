import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { orders } from '@/db/schema'
import { buildPrintLabelForm } from '@/integrations/ecpay/logistics'
import { requireRole } from '@/server/services/AdminAuthService'

/**
 * Renders an HTML page that immediately POSTs to ECPay's print URL,
 * which returns a printable shipping label page (admin clicks
 * browser-Print to send to a physical printer).
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  await requireRole(['owner', 'manager', 'ops'])

  const { id } = await ctx.params
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
  if (!order) return new NextResponse('Order not found', { status: 404 })
  if (!order.ecpayLogisticsId) {
    return new NextResponse('物流單尚未建立，請先點「建立物流單」', { status: 400 })
  }

  const form = buildPrintLabelForm({
    allPayLogisticsId: order.ecpayLogisticsId,
    cvsPaymentNo: order.cvsPaymentNo ?? undefined,
    cvsValidationNo: order.cvsValidationNo ?? undefined,
  })

  const inputs = Object.entries(form.fields)
    .map(
      ([k, v]) =>
        `<input type="hidden" name="${esc(k)}" value="${esc(v)}" />`
    )
    .join('\n')

  const html = `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<title>列印託運單⋯</title>
<style>
  body { font-family: system-ui; text-align: center; padding: 40px; background: #faf7f2; color: #2d2a26; }
  .spin { display: inline-block; width: 28px; height: 28px; border: 3px solid #e8e4dd; border-top-color: #2d2a26; border-radius: 50%; animation: s 800ms linear infinite; }
  @keyframes s { to { transform: rotate(360deg) } }
</style>
</head>
<body>
<div class="spin"></div>
<p>跳轉至綠界託運單列印頁⋯</p>
<form id="ecpayPrintForm" action="${form.url}" method="POST" target="_self">${inputs}</form>
<script>document.getElementById('ecpayPrintForm').submit();</script>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
