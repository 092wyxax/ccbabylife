/**
 * LINE 訊息模板（與 docs/LINE_TEMPLATES.md 對齊）。
 * 用 {{var}} 標記，由 NotificationService 替換。預覽工具用 SAMPLE_VARS 給示意值。
 */

export const SAMPLE_VARS: Record<string, string> = {
  customer_name: '小芳',
  order_number: 'N20260512001',
  order_total: 'NT$2,480',
  tracking_url: 'https://nihon-select.tw/track/abc-123',
  date_jp_order: '5/13',
  date_received_jp: '5/15',
  date_shipping_intl: '5/22',
  date_arrived_tw: '5/26',
  date_expected_delivery: '5/27',
  date_shipped: '5/27',
  date_arrival: '5/28',
  tracking_no: '123-4567-8901',
  remaining_amount: 'NT$1,200',
  payment_url: 'https://nihon-select.tw/pay/abc-123',
  deposit: 'NT$744',
  refund_amount: 'NT$1,736',
  refund_message:
    '退款 NT$1,736 將於 3–5 個工作天退回原信用卡帳戶。',
  baby_age_months: '8',
  product_1_name: 'Combi 香蕉造型固齒器',
  price_1: '690',
  product_2_name: 'Richell 練習杯 200ml',
  price_2: '850',
  product_3_name: 'Pigeon 純水嬰兒濕巾',
  price_3: '460',
  recommend_url: 'https://nihon-select.tw/recommend',
  product_name: 'Pigeon 母乳實感奶瓶 240ml',
  price_jpy: '2,480',
  weight_g: '320',
  estimated_twd: '1,200',
  quote_id: 'q-987',
  about_url: 'https://nihon-select.tw/about',
  site_url: 'https://nihon-select.tw',
  line_official_id: '@nihon-select',
  phone: '02-1234-5678',
  referral_code: 'XIAO-FANG',
}

export interface LineTemplate {
  id: string
  triggerLabel: string
  channel: 'reply' | 'push'
  pricedAt: '免費' | '計費'
  body: string
  notes?: string
}

export const LINE_TEMPLATES: LineTemplate[] = [
  {
    id: 'L1-welcome',
    triggerLabel: 'L1 加好友自動回覆',
    channel: 'reply',
    pricedAt: '免費',
    body: `妳好，這裡是日系選物店～

我們是一家媽媽親選日系母嬰／寵物用品的小店。每週日截單、週一日本下單、約 10–14 天到貨。

⏤
妳可以這樣使用我：
・問訂單狀態：訂單編號 + 「狀態」
・有問題會在 24 小時內回覆（週一～五）
⏤

最新選物：{{site_url}}

新朋友首單享 NT$100 折扣（自動套用）`,
  },
  {
    id: 'L2-paid',
    triggerLabel: 'L2 訂單狀態：已付款',
    channel: 'push',
    pricedAt: '計費',
    body: `[訂單 #{{order_number}}]

我們已收到妳的訂單與付款，謝謝信任 :)

訂單金額：{{order_total}}
預計流程：
・{{date_jp_order}}（一）日本下單
・{{date_received_jp}}（三）商品抵達日本集運倉
・{{date_shipping_intl}}（三）國際集運
・{{date_arrived_tw}}（日）台灣到港、出貨

預計 {{date_expected_delivery}} 寄達。
中間每一步我們都會通知妳。

訂單追蹤：{{tracking_url}}`,
  },
  {
    id: 'L2-sourcing',
    triggerLabel: 'L2 訂單狀態：日本下單中',
    channel: 'push',
    pricedAt: '計費',
    body: `[訂單 #{{order_number}}]

朋友今天在日本通路下單囉～
預計 {{date_received_jp}} 收到貨。`,
  },
  {
    id: 'L7-shipped',
    triggerLabel: 'L7 訂單狀態：已出貨',
    channel: 'push',
    pricedAt: '計費',
    body: `[訂單 #{{order_number}}]

商品已交給黑貓宅配（單號：{{tracking_no}}）。

預計 {{date_arrival}} 送達。請保持手機暢通，宅配會直接聯繫妳。

簽收後若有任何問題，7 天內請告知，我們協助處理。`,
  },
  {
    id: 'L6-payment-reminder',
    triggerLabel: 'L6 尾款催繳（截單前 24 小時）',
    channel: 'push',
    pricedAt: '計費',
    body: `[訂單 #{{order_number}}]

提醒：截單前 24 小時囉～
妳的訂單尚有尾款 {{remaining_amount}} 待繳。

點此繳尾款：{{payment_url}}

過了截單時間（本週日 23:59）將自動取消，訂金不退。`,
  },
  {
    id: 'L5-monthly',
    triggerLabel: 'L5 寶寶月齡推送（每月 1 日）',
    channel: 'push',
    pricedAt: '計費',
    body: `[寶寶月齡推薦]

妳家寶貝這個月滿 {{baby_age_months}} 個月囉～

這個月齡推薦：
🍼 {{product_1_name}} - NT\${{price_1}}
🍼 {{product_2_name}} - NT\${{price_2}}
🍼 {{product_3_name}} - NT\${{price_3}}

完整推薦：{{recommend_url}}

（⚠ 此推送每月一次，回覆「停止推送」可取消）`,
  },
  {
    id: 'L3-quote-success',
    triggerLabel: 'L3 自動報價（成功）',
    channel: 'reply',
    pricedAt: '免費',
    body: `[報價結果]

商品：{{product_name}}
日本售價：¥{{price_jpy}}
重量：{{weight_g}} g

預估台灣售價：NT\${{estimated_twd}}

包含：日方價金 + 國際運費 + 服務費 + 利潤

想下單？回覆「下單 {{quote_id}}」我幫妳建立訂單～`,
    notes: 'Phase 1c 後可能拿掉（重新定位為純購物網而非客製代購）',
  },
]

export function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`)
}
