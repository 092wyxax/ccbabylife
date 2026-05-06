import { config } from 'dotenv'
config({ path: '.env.local' })

async function main() {
  const token = process.env.LINE_MESSAGING_ACCESS_TOKEN
  if (!token) throw new Error('LINE_MESSAGING_ACCESS_TOKEN missing')

  const message = `🎌 熙熙初日 — LINE 推播測試

哈囉！這是從 ccbabylife.com 寄出的測試訊息。

如果你看到這則訊息，表示 LINE Messaging API 已經接好。
未來訂單通知、優惠券發放、補貨提醒、寶寶月齡推送都會從這個官方帳號發送。

時間：${new Date().toLocaleString('zh-Hant', { timeZone: 'Asia/Taipei' })}（台北）`

  console.log('Sending broadcast to all OA followers...')

  const res = await fetch('https://api.line.me/v2/bot/message/broadcast', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{ type: 'text', text: message }],
    }),
  })

  const text = await res.text()
  console.log(`HTTP ${res.status}`)
  console.log(text || '(empty body — that\'s normal for LINE 200 OK)')

  if (!res.ok) process.exit(1)

  console.log('\n✓ LINE accepted the broadcast. Check your LINE chat with the OA.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
