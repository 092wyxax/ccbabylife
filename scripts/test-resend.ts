import { config } from 'dotenv'
config({ path: '.env.local' })

const TO = process.argv[2]
if (!TO) {
  console.error('Usage: pnpm tsx scripts/test-resend.ts <recipient-email>')
  process.exit(1)
}

async function main() {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey) throw new Error('RESEND_API_KEY missing')
  if (!from) throw new Error('EMAIL_FROM missing')

  console.log(`Sending test email`)
  console.log(`  from: ${from}`)
  console.log(`  to:   ${TO}`)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [TO],
      subject: '🎌 熙熙初日 — Resend 測試信',
      html: `
        <div style="font-family: serif; max-width: 540px; margin: 0 auto; padding: 32px; background: #faf7f2; color: #2d2a26;">
          <p style="font-size: 11px; letter-spacing: 0.3em; color: #7a756f; text-transform: uppercase;">TEST · 測試信件</p>
          <h1 style="font-size: 28px; margin: 8px 0 16px;">熙熙初日</h1>
          <p style="line-height: 1.7;">
            你好！這是從 ccbabylife.com 寄出的測試信。
          </p>
          <p style="line-height: 1.7;">
            如果你收到這封信、寄件人顯示為 <strong>熙熙初日 &lt;noreply@ccbabylife.com&gt;</strong>，
            那表示 Resend 已經設定成功，未來訂單通知、優惠券發放、補貨提醒都會從這個地址寄出。
          </p>
          <hr style="border: none; border-top: 1px solid #e8e4dd; margin: 24px 0;">
          <p style="font-size: 12px; color: #7a756f; line-height: 1.7;">
            時間：${new Date().toLocaleString('zh-Hant', { timeZone: 'Asia/Taipei' })}（台北）<br>
            這封信只是測試，不需要回覆。
          </p>
        </div>
      `,
    }),
  })

  const text = await res.text()
  console.log(`HTTP ${res.status}`)
  console.log(text)
  if (!res.ok) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
