# 熙熙初日 · 營運手冊

> 公司營運所需的**業務規則 / 法規 / 品牌 / 定價 / 合夥 / 開發 / 部署 / 推播 / 路線圖**全在這。
> 技術細節（資料庫、API、整合）請看 [ARCHITECTURE.md](./ARCHITECTURE.md)。

---

## 目錄

1. [品牌核心](#1-品牌核心)
2. [業務規則](#2-業務規則)
3. [定價公式](#3-定價公式)
4. [法規地雷清單](#4-法規地雷清單)
5. [品牌語氣 / 視覺](#5-品牌語氣--視覺)
6. [LINE 訊息模板](#6-line-訊息模板)
7. [合夥共識](#7-合夥共識)
8. [選品節奏](#8-選品節奏)
9. [開發慣例](#9-開發慣例)
10. [部署 SOP](#10-部署-sop)
11. [SaaS 化路線圖](#11-saas-化路線圖)
12. [市場情報系統](#12-市場情報系統)

---

## 1. 品牌核心

### 一句話定位
> **「日本媽媽親身試用、嚴選日系好物、不販售需查驗登記商品」**

### 三個關鍵字
- **真實**（媽媽本人 + 真實使用心得）
- **嚴選**（30 件起步，寧少不濫）
- **誠信**（法規地雷不碰）

### 我們不是
- 不是「全品項日本代購」
- 不是「最便宜」
- 不是「網紅選物」

---

## 2. 業務規則

### 2.1 訂單狀態機

| 狀態值 | 中文 | 說明 |
|---|---|---|
| `pending_payment` | 待付款 | 訂單已建立，尚未完成付款 |
| `paid` | 已付款 | 綠界 webhook 確認付款完成 |
| `sourcing_jp` | 日本下單中 | 朋友在日本通路下單 |
| `received_jp` | 日本到貨 | 商品已抵達日本集運倉 |
| `shipping_intl` | 國際集運中 | 集運批次已從日本出口 |
| `arrived_tw` | 台灣到港 | 集運抵達台灣，海關放行中 |
| `shipped` | 已出貨 | 黑貓 / 超商物流取件 |
| `completed` | 已完成 | 客戶簽收 + 7 天無爭議期過 |
| `cancelled` | 已取消 | 訂單在 paid 之前取消 |
| `refunded` | 已退款 | 已退款 |

**合法轉移**：除矩陣中合法外，所有其他轉移皆為非法（`OrderService.changeStatus` 拋出 `InvalidStatusTransitionError`）：

- `pending_payment` → `paid` / `cancelled`
- `paid` → `sourcing_jp` / `cancelled` / `refunded`
- `sourcing_jp` → `received_jp` / `cancelled` / `refunded`
- `received_jp` → `shipping_intl` / `cancelled` / `refunded`
- `shipping_intl` → `arrived_tw` / `refunded`
- `arrived_tw` → `shipped` / `refunded`
- `shipped` → `completed` / `refunded`
- `completed` → `refunded`
- `cancelled` → `refunded`

**規則**：
- 取消（cancelled）只能在 `pending_payment` → `received_jp` 之間
- 退款（refunded）可從 `paid` 起到 `completed` 都進入
- `completed` 不可改回較早狀態（避免會計重複入帳）
- 狀態變更必寫入 `order_status_logs`（操作人 + 原因 + 時戳）

### 2.2 預購制

- **截單**：每週日 23:59
- **日本下單**：每週一
- **預計到貨**：截單後 10–14 天

**付款**：
- 新客：全額預收
- 回頭客（≥ 3 訂單）：可選訂金 30% + 出貨前尾款 70%
- 高價品（≥ NT$5,000）：強制訂金制

**跑單**：
- 訂金已收 + 7 天未補尾款 → 自動 `cancelled`，訂金不退
- 全額預收訂單 → 不會跑單

### 2.3 退款規則

| 情境 | 處理 |
|---|---|
| 客戶下單 24 小時內取消（未付款） | 直接 cancel，無扣費 |
| 已付款、未進日本下單前取消 | 全額退（扣綠界手續費） |
| 已日本下單、未集運前取消 | 退 80%（朋友需協調退貨） |
| 已集運後取消 | 不可取消，僅瑕疵可退 |
| 商品瑕疵 | 全額退或換貨 |
| 客戶簽收 7 天內爭議 | 個案處理 |
| 客戶簽收 7 天後 | 標 `completed`，不再受理 |

### 2.4 購物金

- **取得**：推薦獎金、客訴補償、活動贈送
- **使用**：每筆訂單最多折抵 30%
- **效期**：取得後 12 個月內（`store_credit_expire`）
- 不可轉讓、不可換現金

### 2.5 黑名單

進入觸發條件：
- 連續 2 次跑單
- 客訴後仍惡意散播不實資訊
- 違反法規誠信宣告（要求代購禁運品）

黑名單客戶：不可下單、LINE 推播停止、保留歷史訂單資料。

---

## 3. 定價公式

### 3.1 主公式

```
台幣售價 = ROUND( (日圓成本 × 匯率 + 國際運費 + 服務費) × (1 + 利潤率) , 10 )
```

報價計算機 [`/calculator`](https://ccbabylife.com/calculator) 直接使用此公式。

### 3.2 匯率

- **來源**：台灣銀行現金賣出價（rate.bot.com.tw）
- **抓取**：每日 9:30、15:30 台灣時間，CF Workers 寫入 `settings.exchange_rate`
- **緩衝**：`system_rate = bot_rate × 1.02`（吸收日圓波動 + 信用卡 / 銀行匯費）

### 3.3 國際運費（重量級距）

| 商品重量 | 海運（NT$/件） | 空運（NT$/件） |
|---|---|---|
| < 500 g | 80 | 150 |
| 500 g – 1 kg | 130 | 260 |
| 1 – 3 kg | 250 | 500 |
| 3 – 5 kg | 400 | 800 |
| > 5 kg | 個案估算 | 個案估算 |

### 3.4 服務費

| 商品單價（日圓） | 服務費（NT$） |
|---|---|
| < 1,500 | 50 |
| 1,500 – 5,000 | 80 |
| 5,000 – 15,000 | 150 |
| > 15,000 | 250 |

### 3.5 利潤率

| 品類 | 利潤率 |
|---|---|
| 母嬰服飾 | 30% |
| 母嬰用品（餐具、玩具） | 35% |
| 寵物食品 | 25% |
| 寵物用品 | 30% |
| 限定品 / 排隊品 | 40–50% |

> **底線**：單件毛利不低於 NT$80。

### 3.6 進位規則

- < NT$1,000：進位至最近 10 元
- NT$1,000 – 5,000：進位至最近 50 元
- > NT$5,000：進位至最近 100 元

### 3.7 範例試算

**例 1：日本嬰兒紗布巾（¥980 / 200g）**
```
匯率：0.225 × 1.02 = 0.2295
日幣成本：980 × 0.2295 = 224.9 NT
國際運費：80（< 500g 海運）
服務費：50（< ¥1,500）
小計：354.9
× 1.35（母嬰用品 35%）= 479.1 → 進位 480 NT
```

**例 2：寵物乾糧（¥3,800 / 2 kg）**
```
日幣成本：872.1 + 運費 250 + 服務費 80 = 1,202.1
× 1.25（寵物食品 25%）= 1,502.6 → 進位 1,500 NT
```

### 3.8 例外與覆寫

- `price_twd_locked = true` → 公式變動不重新計算（用於促銷檔期）
- `price_twd_override` → 手動指定價格（在 `audit_logs` 留紀錄）

---

## 4. 法規地雷清單

> 「不賣需查驗登記商品」是核心差異化。

### 4.1 紅燈：絕對不代購

**母嬰類**

| 品類 | 法規 |
|---|---|
| 嬰兒奶粉 | 食安法、嬰兒配方食品查驗登記 |
| 嬰幼兒副食品（米精、麥精、罐頭） | 食安法 |
| 嬰兒專用補充劑（DHA、益生菌） | 健康食品管理法、藥事法 |
| 嬰兒退熱貼劑 | 醫療器材管理法 |
| 處方藥、感冒藥、止痛藥 | 藥事法 |
| 醫療器材（額溫槍、體溫計、血氧機） | 醫療器材管理法 |
| 含藥化妝品（美白、防曬、抗痘） | 化妝品衛生安全管理法 |

**寵物類**

| 品類 | 法規 |
|---|---|
| 寵物處方食品（c/d、k/d） | 藥事法、動物用藥品管理法 |
| 寵物用藥（驅蟲、心絲蟲、皮膚藥） | 動物用藥品管理法 |
| 寵物保健品（CBD、特定營養素） | 視成分而定 |
| 含肉類寵物食品 | 動物傳染病防治條例 |
| 含鮮乳製品的寵物食品 | 同上 |

**食品類**

| 品類 | 法規 |
|---|---|
| 一般食品（餅乾、糖果、飲料、調味料）| 食安法（商業進口需查驗）|
| 健康食品（標保健功效） | 健康食品管理法 |
| 含酒精商品 | 菸酒管理法 |

**其他**

| 品類 | 法規 |
|---|---|
| 武器、刀械（部分日本和包丁） | 槍砲彈藥刀械管制條例 |
| 動植物標本、毛皮製品 | 野生動物保育法、CITES |
| 仿冒品、未授權聯名 | 商標法 |
| 成人用品、未送審玩具 | 商品檢驗法 |

### 4.2 黃燈：需個案評估

- **3 歲以下嬰幼兒玩具**：需 BSMI；無 BSMI 對應驗證 → 不上架
- **嬰幼兒用品**（奶瓶、餐具、安撫巾）：選 Pigeon、Combi、Richell 等大廠通常合規
- **寵物用品**（牽繩、項圈、玩具）：含電子元件需 BSMI
- **化妝品 / 保養品**（不含藥）：母嬰選物店暫不碰

### 4.3 綠燈：可代購

- 嬰兒服飾、童裝（注意安全標準）
- 嬰兒用品（棉布、紗布、固齒器）— 選 CNS 認證大廠
- 寵物外出用品（牽繩、外出包）
- 寵物玩具（純布、純橡膠）
- 母嬰選物（包巾、推車配件、收納）

### 4.4 法規誠信宣告（公開於 `/about`）

> 我們堅持只販售綠燈品項。
> 我們**不代購**任何需查驗登記、需處方、進口檢疫不適用商業通路的商品。
> 即使客戶詢問，我們會婉拒並說明原因。

### 4.5 上架檢核 SOP

每件商品上架前：

- [ ] 對照清單，確認非紅燈
- [ ] 若黃燈，朋友 + 先生雙方核可
- [ ] 商品成分／材質有日方規格說明
- [ ] 後台 `products.legal_check_passed = true`
- [ ] 商品頁不主張任何療效、保健功效、醫療效果
- [ ] 標示來源：「日本平行輸入」、「個人選物」

### 4.6 客訴處理

- 「為什麼不賣 X？」 → 引導至 `/about`
- 他店違法舉報邀請 → 不參與
- 主管機關函詢 → 立即聯繫律師，先生主處理

### 4.7 參考連結

- 食藥署：fda.gov.tw
- 衛福部：mohw.gov.tw
- BSMI：bsmi.gov.tw
- 防檢署：baphiq.gov.tw

---

## 5. 品牌語氣 / 視覺

### 5.1 配色

| 用途 | 色碼 |
|---|---|
| 主背景 cream | `#FAF7F2` |
| 強調色 accent（暖橘） | `#E8896C` |
| 印章 seal（紅褐） | `#B85A4A` |
| sage（鼠尾草綠） | `#9CA893` |
| blush（灰粉） | `#E7C4C0` |
| beige（米沙） | `#E8D9B9` |
| 文字主色 ink | `#2D2A26` |
| 文字次色 ink-soft | `#7A756F` |
| 邊框 line | `#E8E4DD` |

### 5.2 字型

- **品牌標題**：Shippori Mincho（手感日式明朝）
- **中文標題**：Noto Serif TC
- **中文內文**：Noto Sans TC（weight 300–500）
- **手感點綴**：Klee One（jp 副標）

### 5.3 風格

- **日系雜誌**質感（kinfolk、ku:nel 風）
- 留白多、不擠
- 商品照偏自然光、生活情境
- 不使用花俏漸層、emoji 不放前台 UI（情緒時刻例外）

### 5.4 自稱

- 對客戶：「我們」「小編」「娃媽」（看情境）
- 不用「本店」「敝公司」

### 5.5 對客戶

- 預設：「妳」「妳們」（女性客群為主）
- 男性家長：「您」

### 5.6 三條語氣原則

**原則 1：誠實，不造作**
- ✅「我家娃用這個三個月，最大優點是 X，缺點是 Y」
- ❌「100% 媽媽推薦！神級好物！」

**原則 2：知識，不販售**
- ✅「日本嬰兒衣服尺寸 80 通常對應台灣 1 歲，但我家娃比較高，我都買 90」
- ❌「立刻購買享受優惠！」

**原則 3：邊界感**
- 不過度親密、不裝熟
- 客訴要直接道歉，但不卑微

### 5.7 商品頁「我家娃心得」結構

1. 背景（哪個月齡 / 場景開始用）
2. 優點（具體、可驗證細節）
3. 缺點（誠實 — 信任建立關鍵）
4. 適合誰／不適合誰

**範例**：
> 我家娃從 8 個月開始用這個固齒器。
>
> 優點是矽膠軟硬適中、表面有起伏紋路，娃會自己拿著磨牙不哭。Combi 出的，有 BSMI 標誌（編號 R12345），所以我敢給她直接咬。
>
> 缺點是吊環設計，繫在推車上扣具會稍鬆，需要自己加個小束帶。
>
> **適合**：8–18 個月開始長牙、會抓握的寶寶
> **不適合**：6 個月以下還不會穩抓的，會掉地上要常清洗

### 5.8 客服話術

**拒絕代購紅燈品**：
```
妳好，這款商品屬於需查驗登記的醫療器材／處方藥／嬰兒奶粉，
依台灣法規我們無法代購販售。
這是我們選物店「不賣需查驗登記商品」的核心原則之一，
還請見諒～
可以推薦給妳同類安全的選物：[商品連結]
```

**客訴道歉**：
```
不好意思讓妳有這樣的體驗。
能請妳將收到的狀況拍照給我嗎？
我們確認後會立刻[退貨／換貨／退款]，並補償購物金 NT$XXX。
```

不要用「親」「哈囉～」這類過度親密、或用大量驚嘆號／emoji。

---

## 6. LINE 訊息模板

### 6.1 通用變數

- `{{customer_name}}` 客戶名稱
- `{{order_number}}` 訂單編號
- `{{order_total}}` 訂單金額
- `{{tracking_url}}` 訂單追蹤頁

### 6.2 加好友歡迎詞

```
妳好，這裡是熙熙初日～

我們是一家日本媽媽親選日系母嬰／寵物用品的小店。
每週日截單、週一日本下單、約 10–14 天到貨。

⏤
你可以這樣使用我：
・直接貼日本商品 URL，30 秒自動報價
・問訂單狀態：訂單編號 + 「狀態」
・有問題會在 24 小時內回覆（週一～五）
⏤

最新選物：請看官網 → ccbabylife.com
```

### 6.3 訂單狀態推播

**已付款（paid）**
```
[訂單 #{{order_number}}]

我們已收到妳的訂單與付款，謝謝信任 :)

訂單金額：{{order_total}}
預計流程：
・週一日本下單
・週三抵達日本集運倉
・週日國際集運出口
・隔週週日台灣到港、出貨

中間每一步我們都會通知妳。

訂單追蹤：{{tracking_url}}
```

**已出貨（shipped）**
```
[訂單 #{{order_number}}]

商品已交給黑貓宅配（單號：xxx）。
預計明天送達。請保持手機暢通。

簽收後若有任何問題，7 天內請告知，我們協助處理。
```

**已完成（completed）**
```
[訂單 #{{order_number}}]

商品簽收 7 天無爭議，訂單已完成。

如果這次體驗不錯，希望妳願意：
・回 IG 心得 → 抽購物金
・推薦朋友 → 雙方都得 NT$200 折扣

下次再見 ✿
```

### 6.4 報價回覆（自動）

客戶貼日本網址：

```
妳好，這個商品報價如下：

商品：[商品名]
日幣：¥{{price_jpy}}
台幣：NT${{price_twd}}
重量：{{weight_g}} g

預計 10–14 天到貨。
要下單請回 「下單」 + 數量。
```

---

## 7. 合夥共識

> 本文件為內部共識記錄，非正式法律契約。
> 真正生效的合夥條款建議由三人共同找律師起草、簽署。

### 7.1 角色

| 成員 | 主要職責 |
|---|---|
| 先生（Tech Lead）| 系統開發、物流、報關、會計 |
| 太太（Brand & CS）| 內容創作、客服、訂單管理、輕量包裝 |
| 朋友（JP Sourcing）| 日本實地採購、選品、限定品搶購 |

### 7.2 收益分配（待協商）

```
營業額（不含稅）
- 商品成本
- 國際運費實際分攤
- 平台費用（綠界、LINE、伺服器）
- 公司稅費
= 月毛利
```

**分配優先**：
1. 30% 進「公司營運準備金」（到 NT$50 萬上限後降為 10%）
2. 剩餘按以下分配（待三方協商填入）：
   - 系統開發回饋金（先生）
   - 內容 / 客服回饋金（太太）
   - 採購回饋金（朋友）
   - 出資按比例分紅

### 7.3 商品上架流程

1. 朋友提案
2. 太太評估（目標客群匹配 / 心得能不能寫）
3. 先生法規檢核
4. 三方同意 → 太太建檔上架

### 7.4 訂單流程分工

- 客戶下單 → 太太收到通知
- 日本下單 → 朋友執行
- 集運 → 先生協調物流商
- 報關 → 先生
- 出貨 → 先生（重物）+ 太太（輕物 / 美感包裝）
- 客服 → 太太主辦，先生支援技術問題

### 7.5 重大決策（需三方書面同意）

- 上架紅燈或黃燈品項
- 大筆採購（單批 > NT$50 萬）
- 通路擴張（蝦皮、Pinkoi 等）
- 雇用第一個外人
- SaaS 副業切割
- 結束營業

### 7.6 育兒衝突特別條款

太太是主要照顧者，本店是「副業」、不是優先於育兒的事業。

- 寶寶生病、學校事務、健康檢查 → 任何工作可暫停
- 重要訂單期遇此狀況 → 朋友與先生臨時補位
- 客戶因此延遲收貨 → 主動道歉 + 補償購物金，不甩鍋給太太

### 7.7 退場 / 結束

- 一方退出：60 天書面通知、評價公司價值、退出方持股由其他兩人按比例承接
- 結束營業：三方一致決議、清算庫存、剩餘資產按出資比例分配
- 一方逝世：遺屬代位繼承股權

### 7.8 待補

- [ ] 找律師起草正式合約
- [ ] 確認出資比例與股權結構
- [ ] 確認分配比例
- [ ] 開公司戶 + 三方銀行檢視機制

---

## 8. 選品節奏

### 8.1 起步 30 件 SKU 分配

| 品類 | 件數 | 比例 |
|---|---|---|
| 母嬰服飾 | 6 | 20% |
| 母嬰用品（餐具、固齒器、安撫巾） | 8 | 27% |
| 母嬰生活（包巾、推車配件、收納） | 6 | 20% |
| 寵物食品（黃燈品需個案）| 4 | 13% |
| 寵物用品（外出包、玩具、牽繩）| 4 | 13% |
| 限定品 / 排隊品 | 2 | 7% |

> 上線後每月觀察銷售，每月汰換 5 件低銷售商品。

### 8.2 上架資料欄位

每件商品填：
```yaml
slug: japan-pigeon-gauze-towel-sm
name_zh: Pigeon 純棉紗布巾（30×30cm）
name_jp: ピジョン ガーゼハンカチ
brand: Pigeon
category: 母嬰用品
source_url: https://www.rakuten.co.jp/...
price_jpy: 980
weight_g: 80
age_range_months: [0, 36]
legal_check_passed: true
use_experience: |
  我家娃從新生兒用到 1 歲半。
  優點是吸水快、洗多次不變形。
  缺點是純白色易染色，要分洗。
tags: [新生兒, 純棉, 日系經典]
stock_type: preorder
```

---

## 9. 開發慣例

### 9.1 API 層級邊界

| 何時用 | 用途 | 範例 |
|---|---|---|
| **Server Action** | 表單提交、單一動作 | `addToCart`, `checkout`, `updateProfile`, `createProduct` |
| **tRPC** | 後台複雜查詢（含篩選、分頁、即時更新） | `admin.orders.list`, `admin.intelligence.trends` |
| **RSC + Drizzle** | 前台簡單讀取、純展示 | `/shop`, `/shop/[slug]`, `/about` |
| **supabase-js** | 客戶 JWT + RLS 自動把關 | `/account/orders` 客戶看自己訂單 |

### 9.2 資料存取守則

| 路徑 | 使用 | RLS |
|---|---|---|
| 後台 query | Drizzle (service role) | bypass |
| Webhook 處理 | Drizzle (service role) | bypass |
| Cron / Worker | Drizzle (service role) | bypass |
| 客戶寫入（Server Action） | Drizzle (service role) | bypass，**手動 where customer_id** |
| 客戶讀取（前台） | supabase-js (anon + JWT) | **生效** |
| RSC 公開資料 | Drizzle (service role) | bypass |

> **絕不**將 `SUPABASE_SERVICE_ROLE_KEY` 或 `DATABASE_URL` 暴露到客戶端。

### 9.3 Schema 變更流程

1. 修改 `src/db/schema/*.ts`
2. `pnpm drizzle-kit generate` 產生 migration SQL
3. 人工檢查 migration SQL（特別是 RLS、index）
4. 必要時手動編輯（加 RLS policy）
5. `pnpm drizzle-kit migrate` 套用到 Supabase
6. commit schema + migration 一起進 Git

**禁止**：
- 直接在 Supabase Studio 改 schema、加欄位、改 policy
- 跳過 migration 直接 `ALTER TABLE`
- 改名或刪除已 apply 過的 migration

### 9.4 命名與檔案結構

- 元件：`src/components/{shop|admin|tools|shared}/PascalCase.tsx`
- Server Actions：`src/server/actions/{domain}.ts`
- tRPC routers：`src/server/trpc/routers/{domain}.ts`
- Services：`src/server/services/{Domain}Service.ts`
- Drizzle schema：`src/db/schema/{table}.ts`
- 整合：`src/integrations/{vendor}/`

### 9.5 變數命名

- 資料庫欄位：`snake_case`（Drizzle column SQL 名稱）
- TypeScript：`camelCase`
- 元件：`PascalCase`
- 環境變數：`SCREAMING_SNAKE_CASE`

### 9.6 Server-only / Client 邊界

- 含 secret 的檔案 → `src/server/` 或 `src/integrations/`，且開頭加 `import 'server-only'`
- 客戶端 import 這類檔案會在 build 時報錯
- 用了 `useState` 等 client API → 加 `'use client'`

### 9.7 Commit 訊息（Conventional Commits）

```
feat(order): add status transition validation
fix(checkout): handle ECPay duplicate webhook
chore(deps): bump @line/bot-sdk to 9.x
docs: update ARCHITECTURE for v1.1 review
refactor(db): split client into privileged and customer paths
```

prefix：`feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`

### 9.8 測試守則

- **Unit test**（Vitest）：`PricingService` 等純邏輯函式必測
- **Integration test**：webhook 處理、訂單狀態機（轉移合法性窮舉）必測
- **E2E test**（Playwright）：結帳路徑、LINE Login 路徑必測
- 不寫為了測而測的測試

---

## 10. 部署 SOP

### 10.1 環境

| 環境 | 用途 | 觸發 |
|---|---|---|
| Local | 開發 | `pnpm dev` |
| Preview | PR 預覽 | Git PR 自動 |
| Production | 正式 | 推 `main` 分支 |

### 10.2 首次部署

**Supabase**：
1. 在 supabase.com 建專案
2. 取得 `URL` / `anon key` / `service_role key` / `DATABASE_URL`
3. 開啟 Realtime
4. 關閉 Studio 寫入權

**Vercel**：
1. Import GitHub repo
2. Production branch = `main`
3. Project Settings → Environment Variables
4. 設定 custom domain（Cloudflare DNS 指過來）

**Cloudflare**：
1. DNS：domain CNAME 指 Vercel
2. SSL：Full (strict)
3. （可選）Workers AI：商品圖生成

### 10.3 Production 環境變數清單

```
DATABASE_URL
DATABASE_URL_DIRECT
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

ECPAY_MODE
ECPAY_MERCHANT_ID
ECPAY_HASH_KEY
ECPAY_HASH_IV
ECPAY_INVOICE_MERCHANT_ID
ECPAY_INVOICE_HASH_KEY
ECPAY_INVOICE_HASH_IV
ECPAY_SENDER_NAME
ECPAY_SENDER_PHONE

LINE_LOGIN_CHANNEL_ID
LINE_LOGIN_CHANNEL_SECRET
LINE_MESSAGING_CHANNEL_ID
LINE_MESSAGING_CHANNEL_SECRET
LINE_MESSAGING_ACCESS_TOKEN

RESEND_API_KEY
RESEND_FROM

NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT

CRON_SECRET

SENTRY_DSN
SENTRY_ORG
SENTRY_PROJECT
SENTRY_AUTH_TOKEN
NEXT_PUBLIC_SENTRY_DSN

NEXT_PUBLIC_TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY

CF_ACCOUNT_ID
CF_API_TOKEN
```

### 10.4 部署 checklist

- [ ] 跑 `pnpm drizzle-kit migrate` 套用最新 schema
- [ ] Vercel 環境變數對齊 production
- [ ] Sentry 確認 DSN 正確
- [ ] LINE webhook URL 設好
- [ ] ECPay webhook URL 設好
- [ ] DNS 切過去後驗 SSL

### 10.5 Rollback

- Vercel Dashboard → Deployments → 點舊版本「Promote to Production」
- DB schema 回滾：drizzle-kit 沒原生支援；需手動寫 down SQL（少做）

---

## 11. SaaS 化路線圖

### 11.1 假設

- **目標客戶**：1–10 人規模的日本代購商家、選物店、IG 個體戶
- **價值主張**：
  1. 不用自己刻訂單系統 / 商品管理
  2. 內建市場情報
  3. 內建 LINE Bot 自動報價
  4. 不用懂工程

- **不做**：
  - 全功能電商平台（Shopify 已有）
  - 全品類市集（蝦皮已有）
  - 自動 Dropshipping（不符合誠信宣告）

### 11.2 收費模型（粗估）

| 方案 | 月費 | 限制 | 適合誰 |
|---|---|---|---|
| 起步 | NT$1,200 | 50 SKU、100 訂單/月 | 個體戶 |
| 標準 | NT$3,500 | 200 SKU、500 訂單/月、含情報 | 1–3 人小店 |
| 進階 | NT$8,000 | 無限 SKU、2,000 訂單/月、含情報 + AI 客服 | 3–10 人 |

> 本店本身是「進階 + 自家定制」，不付月費（dogfood）。

### 11.3 多租戶（M1 已預備）

- 所有業務表 `org_id` 已內建
- RLS 策略：每個 query 強制過濾 org_id
- 計費：按月發 invoice，過量自動升級提醒

### 11.4 切割時機（早於 Phase 6）

- 自家訂單超過月 500 單 → 系統穩定到位
- 找到第一個 paying beta（朋友圈代購朋友）
- 建立 onboarding SOP

### 11.5 不在路線圖

- 不做：自架 hosting 給客戶（用 Vercel）
- 不做：白標化（客戶用我們網域 + 我們的品牌）
- 不做：客戶 Slack 客服（保持 LINE 客服）

---

## 12. 市場情報系統

### 12.1 內部用途

- 替代「逛網路看大家在說什麼」的人工選品
- 早期發現流量翻倍的商品
- 監控固定競爭對手的上下架、價格變動
- 每週一份 AI 整理的選品建議

### 12.2 資料來源

| 來源 | 抓什麼 | 頻率 | 法規／反爬風險 |
|---|---|---|---|
| PTT BabyMother、Pet 板 | 文章 + 推文 | 每日 | 低 |
| Dcard 親子板 | 同上 | 每日 | 中 |
| 樂天 / Amazon JP 排行榜 | 熱賣榜 Top N | 每週 | 低 |
| IG hashtag #日本代購 | 公開貼文 | 每週 | 中 |
| 競爭對手電商網站 | 商品上下架、價格 | 每日 | 中 |

### 12.3 處理 pipeline

1. **Cloudflare Workers 爬蟲**：fetch + parse + 寫 `raw_posts` 表
2. **Cleaner job**：去重、標註關鍵字（Drizzle）
3. **Trend builder**：聚合過去 7/30 天，算 momentum
4. **AI summary**：每週一給 Claude 跑出選品建議
5. **內部 dashboard**：`/admin/intelligence` 顯示

### 12.4 不能做

- 不抓 Facebook / Threads 私人貼文（用過就違反 ToS）
- 不抓帶 anti-bot 的網站（蝦皮、PChome）
- 不公開競爭對手店名（內部編號）

### 12.5 SaaS 切割時的擴展

- 多租戶版：每家代購可選追蹤的品類
- 共享：所有租戶看到的「日本本國熱賣」資料是共用的
- 隱私：個別租戶的競品監控清單彼此隔離

---

## 附錄：相關檔案

- 程式碼實作：`src/`
- 技術架構：[ARCHITECTURE.md](./ARCHITECTURE.md)
- AI 開發指示：[CLAUDE.md](./CLAUDE.md) → [AGENTS.md](./AGENTS.md)
- GitHub 首頁：[README.md](./README.md)

---

> **本手冊為公司營運共識記錄**，重大條款變更需三方書面確認（LINE 文字也算）。
> 每年 1 月 1 日複審一次。
