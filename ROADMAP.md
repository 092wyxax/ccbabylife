# 熙熙初日 ROADMAP

> 對標《0–6 個月完整執行計畫》+《市場切位策略手冊》兩份 PDF，跟現有 codebase audit 後的執行清單。
>
> 基準 commit：`1146ff3` · 對標日期：2026-05-10
>
> **完成度**：網站前端 15/19 ≈ 79% · 後台/自動化 ≈ 80%
>
> 跟 [HANDBOOK.md](./HANDBOOK.md) 不重疊：HANDBOOK = 制度文件（業務規則、定價、法規、品牌），ROADMAP = 動態執行清單（誰、什麼時候、做什麼）。

---

## § 1. 現況速查（已完成的不再做）

### 前端
Hero 首單 NT$100 banner、LINE 浮動鈕、Newsletter 訂閱+誘因、OrderProgressBar 7 階段視覺化、退換貨頁、`/recommend` 月齡推薦器、`/calculator` 透明定價、`/gift-guide` 彌月禮指南、`/about`、`/faq`、`/journal` 部落格、訂單追蹤頁、退換貨自助申請、寵物分類、加購組合。

### 後台
訂單管理（含 CSV 匯出）、商品 CRUD、客戶資料（含 LINE/月齡）、優惠券（含 4 種自動發券：signup / birthday / restock_filled / referral_complete）、LINE inbox（1對1 客服）、月齡 cron + 推薦分潤、滿額贈/加購、會員分級+自動升等、補貨通知、報表、ECPay 金流 + 7-11/全家物流 + B2C 電子發票。

---

## § 2. 缺口清單（依優先級）

### 🔥 Tier 1 — M1 結束前（≤ 2 週，~20 工時 / 約 3 天集中工作）

| # | 項目 | PDF | 工時 | 主要檔案 |
|---|---|---|---|---|
| 1 | 商品 schema 擴 **5 段式法規欄位**（中文標示 / 法規分類 / 我們做了 / 我們做不到 / 退換貨）取代現有單欄 `legalNotes` | PDF1 §2.2 | 4h | [src/db/schema/products.ts](src/db/schema/products.ts) + 商品編輯/詳情頁 |
| 2 | 商品 schema 擴 **試用筆記結構** `{day1, day7, day14, pros[], cons[], rating}` 取代現有單欄 `useExperience` | PDF1 §2.2 | 4h | 同上 |
| 3 | 商品 schema 加 **`notSuitableFor` 反向清單** + 商品頁區塊 | PDF1 §2.2 | 2h | 同上 |
| 4 | 商品頁加 **延遲補償固定文案**（>14 天每延 1% / >21 天 100% 退費）— 不需 schema，常數即可 | PDF1 §2.4 B | 1h | 商品頁模板 |
| 5 | LINE 加好友 webhook → **自動發 NT$100 首單券** | PDF1 §3.2 | 4h | [src/app/api/line/webhook/route.ts](src/app/api/line/webhook/route.ts) + `coupons.autoIssueOn='line_follow'` |
| 6 | LINE 7 階段推播補齊缺的 4 階段：**日本入荷 / 集運中 / 台灣到港 / 預估到貨**（現有 paid / sourcing / shipped 三階） | PDF1 §3.2 | 3h | [src/server/services/OrderService.ts](src/server/services/OrderService.ts) + line templates |
| 7 | **跨類別免運門檻**（母嬰 + 寵物同車滿 X 免運） | PDF1 §3.3 | 2h | cart 邏輯 + [FreeShipProgress.tsx](src/components/cart/FreeShipProgress.tsx) |

### 📅 Tier 2 — M2–M3

| # | 項目 | PDF | 工時 |
|---|---|---|---|
| 8 | LINE OA 群發後台 UI（已有 `broadcastText()` lib，缺管理頁） | PDF1 §3.3 | 8h |
| 9 | Email 群發後台 UI（Resend 已串） | PDF1 §3.2 | 6h |
| 10 | 訂閱定期購自動建單 cron（schema OK，缺 dispatch 邏輯） | PDF1 §3.3 | 6h |
| 11 | 法規欄位深化：BSMI 字號 / SGS 報告編號 / 檢驗報告檔案上傳 | PDF2 §6.2 | 6h |
| 12 | About Us 補「為什麼不賣奶粉、不賣藥」反向行銷敘事段 | PDF2 §6.2 | 2h |

### 🔭 Tier 3 — M4–M6

| # | 項目 | PDF | 工時 |
|---|---|---|---|
| 13 | 鐵粉村 LINE 群管理（進群審核 + 標記） | PDF1 §3.3 | 8h |
| 14 | ~~市場情報深化：多源爬蟲 + 競品價格追蹤~~ → 改走《AI 自動化》分階段（見下） | PDF2 §⑤ | — |
| 15 | 報表進階：LTV/CAC 儀表板、回頭客分群、LINE 推播點擊率/封鎖率 | PDF1 §3.3、§7 | 10h |
| 16 | 法規說明 PDF 自動產生（每商品「合法可送清單」可下載） | PDF2 §1.4 | 4h |

### 🤖 AI 自動化（取代 #14；參考 PDF《AI自動化.pdf》分階段落地）

| # | 階段 | 工時 | 月成本 | 太太每週節省 | 狀態 |
|---|---|---|---|---|---|
| A1 | **商品上架 AI 一條龍**：URL → 抽資料 + 生成中文標題 / 賣點 / SEO / IG 初稿 + 月齡 / 品類自動推測 + 不適合誰用清單 | 50h | ~NT$200 | ~6 h | ✅ 完成 |
| A2 | **監控警報**：銷量異常 / 加購率掉 / 出現差評 → LINE OA 主動推 | 45h | 0 | ~3.5 h | 待做 |
| A3 | **輕量週報**：擴 Rakuten 子分類 + Google Trends + 朋友 keyword 表單 → Claude 寫週報 + LINE 推 | 70h | ~NT$80 | ~5 h | 待做 |

**A 系列關鍵設計**：跳過 PTT / Dcard / 蝦皮 / IG / Threads 爬蟲（反爬重、ScraperAPI 月費 USD49 不划算）；不做 embedding / clustering（維護成本高）。Rakuten + Google Trends + 朋友人工 keyword 已覆蓋 ~80% 訊號。

→ 全做完總計 ~5 週、月成本 ~NT$300，覆蓋 PDF 預估 17h/週節省的 85%（14.5 h/週）。

### 🌱 Tier 4 — M7+ 才考慮
- 「熙熙嚴選」聯名款後台支援（限定 SKU 標記、限量倒數）
- 自有 SKU 設計師授權追蹤
- Threads 廣告投放後台串接（M12 後）

---

## § 3. 非工程任務（不寫程式但要做）

### 今天就做
- [ ] 後台刪測試商品「23w213」、「33333 個月」（先生 5 分鐘）
- [ ] 太太開個人 Threads「○○媽@熙熙初日」+ 第一篇貼文（30 分鐘）
- [ ] LINE OA 圖文選單 v4 上傳（太太 1 小時）
- [ ] Vercel env vars 一次補齊（先生 30 分鐘）：
  - `RESEND_API_KEY`
  - `LINE_MESSAGING_CHANNEL_SECRET`、`LINE_CHANNEL_ACCESS_TOKEN`
  - `VAPID_PUBLIC_KEY`、`VAPID_PRIVATE_KEY`
  - `ECPAY_*`（生產環境憑證）

### M1 內
- [ ] 太太把現有商品的 `useExperience`、`legalNotes` 欄位填真實內容（等 Tier 1 #1–#3 schema 擴好就改填新結構）
- [ ] 太太加入 5 個 FB 媽媽社團（先觀察 1 週，第 2 週開始參與留言不推銷）
- [ ] 太太把 LINE OA 種子好友拉到 50 個（親友 + IG 私訊客）

### M1–M6 持續
- Threads 每日 2–5 則 + 留 20–30 則他人留言（太太，每天 30–60 分鐘）
- 25 篇 SEO 文章排程（每月 4–8 篇，外包寫手 NT$5,000/篇 = 總 NT$125,000）
- IG 每週 3–4 篇 + 限動每日 3–5 則 + Reels 1–2 支
- LINE OA 每週 1–2 則群發（過量會被封鎖）
- 出貨 SOP（週日截單 → 週一下單 → 週六到貨 → 週日分裝）

---

## § 4. 不做 / 暫緩（PDF 明確指出）

- ❌ 大而全的後台（仿 91APP 必死）
- ❌ 倉儲管理系統（規模沒到）
- ❌ 行銷自動化平台 MAAC（M6 後再評估）
- ❌ 手機 App（Web 響應式夠用）
- ❌ 自有 SKU 開發（M19 後依 LTV/CAC 數據再決定）
- ❌ FB 付費廣告（前 6 個月預算 = NT$0）
- ❌ Meta DPA 動態廣告（待 200 個 Pixel 購買事件後）

---

## § 5. 6 個月里程碑映射

| 月份 | PDF 階段 | 工程 (本檔) | 關鍵指標目標 |
|---|---|---|---|
| M1 | 基礎建設 | Tier 1 全部 + 「今天就做」清單 | Threads 100 / LINE 50 / 月訂單 5–10 |
| M2 | 內容啟動 | Tier 2 #8、#9、#12 | Threads 500 / LINE 150 / 首單 30 |
| M3 | 系統化 | Tier 2 #10、#11 | Threads 1,500 / LINE 350 / 月營收 NT$8–18 萬 |
| M4 | 深化信任 | Tier 3 #13 | 鐵粉村 30 / 月訂單 80 / 首批回頭客 |
| M5 | 擴大範圍 | Tier 3 #14、#15 | SEO 18 篇 / 月訂單 150 / 月營收 NT$25 萬 |
| M6 | 數據驗證 | Tier 3 #16 + 重新 audit | LTV/CAC ≥ 8 / SKU 80+ / 月營收 NT$40 萬+ |

---

## § 6. 附錄：完整 audit 結果

### 前端 19 項

| # | 項目 | 狀態 | 位置 |
|---|---|---|---|
| 1 | Hero 首單 NT$100 banner | ✅ | [src/app/(public)/page.tsx](src/app/(public)/page.tsx) L86–116 |
| 2 | 右下角浮動 LINE 按鈕 | ✅ | [LineFloatingButton.tsx](src/components/shared/LineFloatingButton.tsx) |
| 3 | Newsletter 訂閱+誘因 | ✅ | [page.tsx](src/app/(public)/page.tsx) L330–366 |
| 4 | 法規說明 5 段式 | 🟡 | [products.ts](src/db/schema/products.ts) L65 — 只有單欄 `legalNotes` |
| 5 | 14 天試用筆記 | 🟡 | products.ts L52 — 只有單欄 `useExperience` |
| 6 | 「不適合誰用」反向清單 | ❌ | schema 無欄位，頁面無區塊 |
| 7 | 預購進度可視化（4–5 階段） | ✅ | [OrderProgressBar.tsx](src/components/order/OrderProgressBar.tsx) — 7 階段 |
| 8 | 延遲補償文案 | ❌ | 商品頁無此資訊 |
| 9 | 退換貨政策頁 | ✅ | [terms/page.tsx](src/app/(public)/terms/page.tsx) + [track/return/page.tsx](src/app/(public)/track/[orderId]/return/page.tsx) |
| 10 | `/recommend` 月齡推薦器 | ✅ | [recommend/page.tsx](src/app/(public)/recommend/page.tsx) |
| 11 | `/calculator` 透明定價 | ✅ | [calculator/page.tsx](src/app/(public)/calculator/page.tsx) |
| 12 | `/gift-guide` 彌月禮指南 | ✅ | [gift-guide/page.tsx](src/app/(public)/gift-guide/page.tsx) |
| 13 | `/about` 反向行銷敘事 | ✅ | [about/page.tsx](src/app/(public)/about/page.tsx) — 已有基礎，需擴 |
| 14 | `/faq` 常見問題 | ✅ | [faq/page.tsx](src/app/(public)/faq/page.tsx) |
| 15 | `/journal` 部落格 | ✅ | [journal/page.tsx](src/app/(public)/journal/page.tsx) |
| 16 | 訂單追蹤頁 7 階段 | ✅ | OrderProgressBar.tsx |
| 17 | 退換貨自助申請 | ✅ | track/return/page.tsx |
| 18 | 寵物 / 母嬰分類 | ✅ | page.tsx L191–254 |
| 19 | 加購組合 | ✅ | [AddonsSection.tsx](src/components/shop/AddonsSection.tsx) — 缺跨類別免運門檻 |

### 後台 / 系統 23 項

| # | 項目 | 狀態 | 位置 |
|---|---|---|---|
| 1 | 訂單管理 + CSV 匯出 | ✅ | [admin/orders/](src/app/admin/(authed)/orders/) + export/route.ts |
| 2 | 商品 CRUD + 現貨/預購切換 | ✅ | [admin/products/](src/app/admin/(authed)/products/) |
| 3 | 客戶資料（LINE/月齡） | ✅ | [customers.ts](src/db/schema/customers.ts) |
| 4 | 優惠券（4 種自動發券） | ✅ | [admin/marketing/coupons/](src/app/admin/(authed)/marketing/coupons/) |
| 5 | LINE 7 階段推播 | 🟡 | OrderService.ts — 已做 paid / sourcing / shipped 3 階；缺 4 階 |
| 6 | LINE 加好友自動發 NT$100 券 | ❌ | webhook 無此 trigger |
| 7 | LINE OA 群發後台 UI | ❌ | 有 `broadcastText()` lib 但無管理頁 |
| 8 | LINE 服務收件匣 | ✅ | [admin/inbox/](src/app/admin/(authed)/inbox/) |
| 9 | Newsletter 訂閱/退訂 | ✅ | [newsletter.ts](src/server/actions/newsletter.ts) — 缺群發 UI |
| 10 | Email 服務（Resend） | 🟡 | [resend-client.ts](src/lib/resend-client.ts) — 通知整合好，缺批量 UI |
| 11 | 月齡 cron + push | ✅ | [api/cron/baby-age-push/](src/app/api/cron/baby-age-push/route.ts) |
| 12 | 推薦分潤系統 | ✅ | [api/referral/](src/app/api/referral/) + ReferralService.ts |
| 13 | 鐵粉村 LINE 群管理 | ❌ | 無 schema / cron / 後台 |
| 14 | 滿額贈 / 加購促銷 | ✅ | [admin/promotions/](src/app/admin/(authed)/promotions/) |
| 15 | 會員分級 + 自動升等 | ✅ | [admin/member-tiers/](src/app/admin/(authed)/member-tiers/) |
| 16 | 補貨通知 | ✅ | [admin/restock/](src/app/admin/(authed)/restock/) |
| 17 | 訂閱定期購 | 🟡 | schema 完成，[admin/subscriptions/](src/app/admin/(authed)/subscriptions/) — 缺自動建單 |
| 18 | 報表（月銷售 / LTV） | ✅ | [admin/reports/](src/app/admin/(authed)/reports/) |
| 19 | 市場情報 / 趨勢 | 🟡 | [api/cron/scrape-trending/](src/app/api/cron/scrape-trending/) — 單源 |
| 20 | ECPay 金流 | ✅ | [integrations/ecpay/payment.ts](src/integrations/ecpay/payment.ts) |
| 21 | ECPay 7-11 / 全家 物流 | ✅ | [integrations/ecpay/logistics.ts](src/integrations/ecpay/logistics.ts) |
| 22 | 電子發票 | ✅ | [integrations/ecpay/invoice.ts](src/integrations/ecpay/invoice.ts) |
| 23 | 商品法規欄位（BSMI / SGS） | 🟡 | products.ts — 有 `legalCheckPassed` + `legalNotes`，缺結構化字號欄位 |

---

## § 7. 維護

- 每月底花 30 分鐘比對 PDF KPI（HANDBOOK §7）vs 後台 reports，落差超過 30% 調整 Tier 排程
- M3 結束時重新 audit 一次，把已完成項目從 ROADMAP 移到 CHANGELOG（之後再開）
- 新需求進來先看是否在 Tier 4「不做」列表內，避免功能蔓延
