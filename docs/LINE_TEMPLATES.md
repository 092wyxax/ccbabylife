# LINE 訊息模板

> 所有 LINE 推播 / 自動回覆的文案模板。
> 程式碼套用於 `src/server/services/NotificationService.ts`。
> 變數以 `{{xxx}}` 表示，由 NotificationService 替換。

---

## 1. 通用變數

- `{{customer_name}}` 客戶名稱（LINE display name）
- `{{order_number}}` 訂單編號（如 N20260512001）
- `{{order_total}}` 訂單總額（含 NT$ 前綴）
- `{{tracking_url}}` 訂單追蹤頁 URL
- `{{calendar_date}}` 日期（YYYY/MM/DD）

---

## 2. 訂單狀態推播（L2）

對應 `docs/BUSINESS_RULES.md` §1.1 的訂單狀態。

### 2.1 已付款（paid）

```
[訂單 #{{order_number}}]

我們已收到妳的訂單與付款，謝謝信任 :)

訂單金額：{{order_total}}
預計流程：
・{{date_jp_order}}（一）日本下單
・{{date_received_jp}}（三）商品抵達日本集運倉
・{{date_shipping_intl}}（三）國際集運
・{{date_arrived_tw}}（日）台灣到港、出貨

預計 {{date_expected_delivery}} 寄達。
中間每一步我們都會通知妳。

訂單追蹤：{{tracking_url}}
```

### 2.2 日本下單中（sourcing_jp）
```
[訂單 #{{order_number}}]

朋友今天在日本通路下單囉～
預計 {{date_received_jp}} 收到貨。
```

### 2.3 日本到貨（received_jp）
```
[訂單 #{{order_number}}]

商品已送達日本集運倉。
本週末 {{date_shipping_intl}} 將開始國際集運。
```

### 2.4 國際集運（shipping_intl）
```
[訂單 #{{order_number}}]

商品已從日本出口集運中，預計 {{date_arrived_tw}} 抵達台灣。
```

### 2.5 台灣到港（arrived_tw）
```
[訂單 #{{order_number}}]

商品已抵達台灣，海關放行中。
預計 {{date_shipped}} 出貨給妳。
```

### 2.6 已出貨（shipped）— L7
```
[訂單 #{{order_number}}]

商品已交給黑貓宅配（單號：{{tracking_no}}）。

預計 {{date_arrival}} 送達。請保持手機暢通，宅配會直接聯繫妳。

簽收後若有任何問題，7 天內請告知，我們協助處理。
```

### 2.7 已完成（completed）
```
[訂單 #{{order_number}}]

訂單已完成 :)
若使用心得不錯，歡迎在我們官網留下評價，或推薦給朋友 →
推薦碼：{{referral_code}}（朋友首單享 NT$100 折扣，妳獲 NT$100 購物金）
```

### 2.8 已取消（cancelled）
```
[訂單 #{{order_number}}]

訂單已取消。
{{refund_message}}

若有疑問請直接回覆此訊息。
```

`refund_message` 視情況：
- 未付款：「本筆訂單未付款，無需退款。」
- 已付款（國內）：「退款 {{refund_amount}} 將於 3–5 個工作天退回原信用卡／ATM 帳戶。」
- 訂金已收（已日本下單）：「依規範訂金 {{deposit}} 不退（已產生實際採購成本），餘額退還 {{refund_amount}}。」

---

## 3. 尾款催繳（L6）

### 3.1 第一次催（截單前 24 小時）
```
[訂單 #{{order_number}}]

提醒：截單前 24 小時囉～
妳的訂單尚有尾款 {{remaining_amount}} 待繳。

點此繳尾款：{{payment_url}}

過了截單時間（本週日 23:59）將自動取消，訂金不退。
```

### 3.2 第二次催（截單前 6 小時）
```
[訂單 #{{order_number}}]

⚠ 最後 6 小時：
妳的尾款 {{remaining_amount}} 還沒收到，
請於今晚 23:59 前繳交，否則訂單將自動取消。

繳費連結：{{payment_url}}
```

### 3.3 自動取消通知
```
[訂單 #{{order_number}}]

訂單已自動取消（尾款逾期）。
依約定，訂金 {{deposit}} 不退。

若有任何疑問請直接回覆此訊息與我們聯繫。
```

---

## 4. 加好友歡迎（L1）

```
妳好，這裡是日系選物店～

我們是一家媽媽親選日系母嬰／寵物用品的小店。每週日截單、週一日本下單、約 10–14 天到貨。

⏤
妳可以這樣使用我：
・直接貼日本商品 URL，30 秒自動報價
・問訂單狀態：訂單編號 + 「狀態」
・有問題會在 24 小時內回覆（週一～五）
⏤

最新選物：{{site_url}}

新朋友首單享 NT$100 折扣（自動套用）
```

---

## 5. 自動報價（L3）— Phase 3

當客戶在 LINE 貼上日本商品 URL：

### 5.1 報價成功
```
[報價結果]

商品：{{product_name}}
日本售價：¥{{price_jpy}}
重量：{{weight_g}} g

預估台灣售價：NT${{estimated_twd}}

包含：日方價金 + 國際運費 + 服務費 + 利潤

想下單？回覆「下單 {{quote_id}}」我幫妳建立訂單～
```

### 5.2 紅燈品
```
[商品檢核]

抱歉～這款商品屬於需查驗登記的品項，
依台灣法規我們無法代購販售。

可以推薦同類綠燈商品給妳：
{{recommendation_url}}

關於我們的法規誠信原則：
{{about_url}}
```

### 5.3 無法解析 URL
```
[報價]

抱歉，這個 URL 我們暫時無法解析。
目前支援：
・樂天市場 rakuten.co.jp
・Amazon 日本 amazon.co.jp
・ZOZOTOWN zozo.jp

或妳可以直接傳商品名稱 + 日本售價，我手動報給妳。
```

---

## 6. 月齡推送（L5）— Phase 3

每月 1 日推送該月適合月齡的商品：

```
[寶寶月齡推薦]

妳家寶貝這個月滿 {{baby_age_months}} 個月囉～

這個月齡推薦：
🍼 {{product_1_name}} - NT${{price_1}}
🍼 {{product_2_name}} - NT${{price_2}}
🍼 {{product_3_name}} - NT${{price_3}}

完整推薦：{{recommend_url}}

（⚠ 此推送每月一次，回覆「停止推送」可取消）
```

> 例外：emoji 在月齡推送可放（更輕鬆、社群感強），其他訂單類訊息保持極簡。

---

## 7. 客服分流（L4）— Phase 3

當客戶傳一般訊息（非 URL、非「狀態」「下單 X」），AI 客服判斷：

### 7.1 訂單查詢
```
要查訂單嗎？
請告訴我訂單編號，或回覆「我的訂單」我幫妳列出最近 5 筆。
```

### 7.2 退換貨
```
我幫妳轉接給客服～
請告訴我：
1. 訂單編號
2. 想退貨／換貨／詢問
3. （如為瑕疵）拍張照給我

工作時間 24 小時內會回覆妳。
```

### 7.3 法規詢問
```
若是想知道為什麼有些商品我們不賣，
詳細說明在這 → {{about_url}}

如果商品具體是哪一件想確認，貼給我我幫妳查～
```

### 7.4 其他
```
讓我看看妳問的是什麼～
我先轉給人類客服，工作時間 24 小時內會回覆。

（如果是急事 + 訂單問題，請打 {{phone}}）
```

---

## 8. Email 備援版本（M5）

訂單狀態推播同步寄 Email；訊息精簡：

### 8.1 已付款
```
主旨：[日系選物店] 訂單 #{{order_number}} 已付款

{{customer_name}} 妳好，

我們已收到妳的訂單 #{{order_number}}，金額 {{order_total}}。

預計出貨日：{{date_expected_delivery}}
訂單追蹤：{{tracking_url}}

——
日系選物店
{{site_url}}
LINE ID：{{line_official_id}}
```

> Email 不重複 LINE 已詳述的內容，主要作為「LINE 沒收到」的備援。

---

## 9. 待補

- [ ] L3 自動報價 Phase 3 動工時，依實際 LINE Bot 框架輸出 Flex Message JSON
- [ ] 推薦人分潤通知文案
- [ ] 限時優惠群發文案
- [ ] 黑名單客戶被擋下單時的訊息
