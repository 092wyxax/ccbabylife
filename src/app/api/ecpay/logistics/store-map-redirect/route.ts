import { NextRequest, NextResponse } from 'next/server'
import { buildStoreMapForm, type CvsType } from '@/integrations/ecpay/logistics'
import { siteUrl } from '@/integrations/ecpay/config'

const VALID: CvsType[] = ['UNIMARTC2C', 'FAMIC2C', 'HILIFEC2C', 'OKMARTC2C']

export async function POST(req: NextRequest) {
  const fd = await req.formData()
  const merchantTradeNo = (fd.get('merchantTradeNo') as string) ?? `T${Date.now()}`
  const cvsType = fd.get('cvsType') as string
  if (!VALID.includes(cvsType as CvsType)) {
    return new NextResponse('invalid cvsType', { status: 400 })
  }

  const form = buildStoreMapForm({
    merchantTradeNo,
    cvsType: cvsType as CvsType,
    serverReplyUrl: `${siteUrl()}/api/ecpay/logistics/store-pick`,
  })

  const inputs = Object.entries(form.fields)
    .map(
      ([k, v]) =>
        `<input type="hidden" name="${esc(k)}" value="${esc(v)}" />`
    )
    .join('\n')

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>跳轉⋯</title></head>
<body style="font-family:sans-serif;text-align:center;padding:40px">
<p>正在跳轉至門市選擇⋯</p>
<form id="f" action="${form.url}" method="POST">${inputs}</form>
<script>document.getElementById('f').submit();</script>
</body></html>`

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
