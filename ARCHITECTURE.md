# 日系選物店 — 完整系統架構文件

> **專案代號**：`nihon-select`（暫定）
> **業務類型**：日本母嬰／寵物代購選物店
> **架構版本**：**v1.1**（含 H1–H6、M1–M6 審查修正）
> **建立日期**：2026-05-02
> **最後更新**：2026-05-02
> **文件語言**：繁體中文
> **適用對象**：開發者（先生）、營運者（太太）、合夥人（朋友）

> 🆕 **v1.1 摘要**
> 本版基於 v1.0 的架構審查（`/Users/lichenghan/.claude/plans/replicated-strolling-newell.md`），整合以下修正：
> - **資料存取**：劃定 Drizzle 特權路徑 vs supabase-js 客戶路徑（H1）
> - **認證**：前後台採雙軌（後台 Supabase Auth、前台 LINE Login + 自簽 JWT）（H2）
> - **Schema**：單一來源宣告，禁止 Supabase Studio 改 schema（H3）
> - **訂單狀態機**：新增轉移約束矩陣（H4，詳見 `docs/BUSINESS_RULES.md`）
> - **Cron**：移到 Cloudflare Workers Cron Triggers（H5）
> - **Phase 1 重切**：4 週 → 7 週，分 1a/1b/1c（H6）
> - **行政流程**：Week 1 啟動黑貓特約、綠界正式商家、LINE 官方帳號認證（M2）
> - **LINE 預算**：補上訊息量試算（M3）
> - **資料處理**：移除 Supabase Edge Functions 一層，併入 CF Workers（M4）
> - **Email 備援**：新增 Resend 作為 LINE 之外的通知 fallback（M5）
> - **多租戶**：所有業務表第一天加 `org_id`（M1，已決議 SaaS 化機率 ≥ 30%）
> - **目錄**：新增 `docs/CONVENTIONS.md`（Server Actions vs tRPC 邊界）

---

## 目錄

1. [專案概覽](#1-專案概覽)
2. [核心定位與差異化](#2-核心定位與差異化)
3. [技術棧](#3-技術棧)
4. [系統架構](#4-系統架構)
5. [模組總覽](#5-模組總覽)
6. [資料庫 Schema](#6-資料庫-schema)
7. [外部整合](#7-外部整合)
8. [專案目錄結構](#8-專案目錄結構)
9. [開發 Phase 規劃](#9-開發-phase-規劃)
10. [環境設定](#10-環境設定)
11. [部署架構](#11-部署架構)
12. [安全與權限](#12-安全與權限)
13. [監控與分析](#13-監控與分析)
14. [成本估算](#14-成本估算)
15. [文件清單](#15-文件清單)
16. [v1.1 變更紀錄](#16-v11-變更紀錄)

---

## 1. 專案概覽

### 1.1 業務模型
- **B2C 預購制日系選物店**，主打母嬰、寵物（綠燈品類）
- 客戶在 Threads/IG 看到內容 → 進官網下單 → LINE 客服 + 售後
- 週批次預購制（週日截單、週一日本下單、10–14 天到貨）
- 同步開發「市場情報系統」作為內部選品工具與未來 SaaS 副業

### 1.2 三人團隊角色
| 角色 | 職責 |
|---|---|
| 先生（Tech Lead）| 系統開發、物流、報關、會計、搬重物 |
| 太太（Brand & CS）| 內容創作、客服、訂單管理、輕量包裝 |
| 朋友（JP Sourcing）| 日本實地採購、選品、限定品搶購、品牌洽談 |

### 1.3 核心商業特色
- 完全使用公司行號（統編 60766849）報關
- 30 件嚴選 SKU 起步（依銷售動態擴充）
- 全額預收為主（新客）、訂金制為輔（高價品/回頭客）
- 每週一次集運批次出貨

---

## 2. 核心定位與差異化

### 2.1 品牌定位
> **「1 歲娃媽親身試用、嚴選日系好物、不賣需查驗登記商品」**

### 2.2 五大差異化武器
| # | 武器 | 對手做不到的原因 |
|---|---|---|
| 1 | 真實 1 歲娃媽身份 | 沒有娃 / 不願露出 |
| 2 | LINE Bot 30 秒自動報價 | 沒有工程師資源 |
| 3 | 7 階段進度條 + LINE 推播 | 仍以人工 LINE 回覆為主 |
| 4 | 寶寶月齡訂閱式選品 | 沒有時間軸經營意識 |
| 5 | 法規誠信宣告 | 動了他們最賺的品項 |

### 2.3 內容鉤子（流量入口）
- **報價計算機**（Calculator）— 免登入、SEO 引流
- **月齡推薦器**（Age Recommender）— 互動式問答
- **彌月禮預算指南**（Gift Guide）— 永恆需求
- **競品智能監控**（內部用）— 選品護城河

---

## 3. 技術棧

### 3.1 完整技術選型

```
─── 前端 ─────────────────────────────────
Next.js 16 (App Router) + TypeScript 5
Tailwind CSS v4 + shadcn/ui
TanStack Query v5（後台複雜查詢）

─── 後端 ─────────────────────────────────
Server Actions + next-safe-action（寫入操作）
tRPC v11（後台複雜查詢）
Zod（資料驗證）
邊界規則見 docs/CONVENTIONS.md

─── 資料庫 ───────────────────────────────
Supabase Postgres（主資料庫）
Drizzle ORM + drizzle-kit（query + migration、Schema 唯一來源）
Supabase Realtime（Phase 4 才啟用，初期 polling）
🆕 v1.1：資料存取雙路徑（見 §6.4）

─── 認證 ─────────────────────────────────
🆕 v1.1：雙軌設計
- 後台：Supabase Auth（email + password）
- 前台：LINE Login + 自簽 JWT，寫 customers 表（不依賴 Supabase Auth）
詳見 §12.1

─── 金流 ─────────────────────────────────
綠界 ECPay（信用卡 / ATM / 超商 / 7-11 物流）
LINE Pay（後期加上）

─── 通訊 ─────────────────────────────────
LINE Messaging API（Reply 免費 + Push 計費）
LINE Login
🆕 v1.1：Resend（交易郵件備援，見 M5）

─── 物流 ─────────────────────────────────
黑貓宅急便 API（特約申請 Week 1 啟動）
綠界整合的 4 大超商物流

─── AI ──────────────────────────────────
Vercel AI SDK v4（統一介面）
@ai-sdk/anthropic（Claude，主力）
@ai-sdk/openai（OpenAI，Embedding）

─── CDN/儲存 ─────────────────────────────
Cloudflare DNS + WAF
Cloudflare Images（商品圖、自動優化）
Supabase Storage（用戶上傳、私密檔）

─── 自動化／背景任務 ─────────────────────
🆕 v1.1：簡化為單一 runtime
Cloudflare Workers + Cron Triggers（爬蟲、匯率、所有排程任務）
（移除 Supabase Edge Functions，理由見 M4）

─── 監控 ─────────────────────────────────
Sentry（錯誤追蹤）
Vercel Analytics（流量）
PostHog（使用者行為，後期）

─── 開發工具 ─────────────────────────────
GitHub + GitHub Actions（CI/CD）
Vercel（前後端主站部署）
ESLint + Prettier + Husky（程式碼品質）
Playwright（E2E 測試，後期）
Vitest（單元測試）
```

### 3.2 不採用的技術與原因
| 不採用 | 原因 |
|---|---|
| 純 tRPC | 對表單操作太重 |
| 純 Server Actions | 對複雜查詢不夠 |
| Prisma | 2026 主流已轉向 Drizzle |
| Neon | Supabase 整合認證 + 儲存更划算 |
| PlanetScale | 無免費版、且為 MySQL |
| Stripe | 台灣不支援個人戶 |
| Webpack | Turbopack 已成 Next.js 預設 |
| 🆕 Supabase Edge Functions | 與 CF Workers 角色重疊，併入 Workers 簡化部署與日誌 |
| 🆕 next-auth | 後台用 Supabase Auth、前台 LINE Login 自簽 JWT，不需要中介層 |

---

## 4. 系統架構

### 4.1 整體架構圖（文字版）

```
┌─────────────────────────────────────────────────────┐
│                    使用者層                          │
│   客戶（手機/桌機）│ 你/太太/朋友（後台）│ 訪客       │
└─────────────────┬───────────────┬───────────────────┘
                  │               │
       ┌──────────▼─────┐  ┌──────▼──────┐
       │  Cloudflare    │  │  CDN/Images │
       │  DNS + WAF     │  │             │
       └──────────┬─────┘  └──────┬──────┘
                  │               │
       ┌──────────▼───────────────▼─────────────┐
       │         Vercel（Next.js 16）            │
       │  ┌─────────────┐  ┌─────────────────┐  │
       │  │ 前台 Web    │  │ 後台 Admin      │  │
       │  │ (LINE JWT)  │  │ (Supabase Auth) │  │
       │  └─────────────┘  └─────────────────┘  │
       │  ┌──────────────────────────────────┐  │
       │  │  API Layer (Server Actions+tRPC) │  │
       │  └──────────────────────────────────┘  │
       │  ┌──────────────────────────────────┐  │
       │  │  Service Layer (業務邏輯)         │  │
       │  └──────────────────────────────────┘  │
       └────────────────┬───────────────────────┘
                        │
        ┌───────────────┼───────────────────┐
        │               │                   │
┌───────▼─────┐  ┌──────▼──────┐  ┌────────▼─────────┐
│  Supabase   │  │  Cloudflare │  │  外部 API        │
│  Postgres   │  │   Workers   │  │  ─ 綠界           │
│  + Auth     │  │  (爬蟲+排程  │  │  ─ LINE          │
│  + Storage  │  │   +清理)    │  │  ─ Claude        │
│  + Realtime │  │             │  │  ─ OpenAI        │
└─────────────┘  └─────────────┘  │  ─ 黑貓           │
                                   │  ─ 樂天           │
                                   │  ─ Resend (Email)│
                                   └──────────────────┘
```

### 4.2 三大子系統 → 🆕 改為兩大子系統

```
1. 主應用（nihon-select-app）
   - 前台：客戶購物網站（LINE JWT 認證）
   - 後台：營運管理系統（Supabase Auth）
   - 部署：Vercel

2. Workers 微服務（nihon-select-workers）→ 整合原爬蟲與資料處理層
   - PTT、Dcard、蝦皮、Google Trends、樂天 JP 爬蟲
   - 排程任務（更新月齡、催繳、週報生成、備份）
   - Claude 資料清理、OpenAI Embedding
   - 部署：Cloudflare Workers + Cron Triggers
```

### 4.3 資料流向

```
客戶下單流程：
社群（Threads/IG）
  → 點擊連結
  → 進入官網（Vercel）
  → LINE Login（自簽 JWT、寫 customers 表）
  → 加入購物車
  → 結帳（Server Action → 綠界 API）
  → Webhook 回傳（建立 Order，狀態機嚴格檢查）
  → LINE Push + Email（雙通道通知）
  → 訂單追蹤頁

市場情報流程（🆕 統一在 CF Workers）：
Cloudflare Workers Cron（每日凌晨 3:00）
  → 爬 PTT/Dcard/蝦皮/Trends
  → 同 Worker 內 call Claude API 分類、清理
  → call OpenAI Embedding 分群
  → 寫入 Supabase（透過 service role key）
  → 每週一 8:00 另一條 Cron 生成週報
  → LINE 推播給你
  → 後台儀表板可視化
```

---

## 5. 模組總覽

### 5.1 前台模組（Customer-Facing）

| ID | 模組 | 路徑 | 說明 |
|---|---|---|---|
| C1 | 首頁 | `/` | 編輯式內容 + 商品入口 |
| C2 | 商品列表 | `/shop` | 30+ 件商品瀏覽 |
| C3 | 商品詳情 | `/shop/[slug]` | 含「我家娃使用心得」 |
| C4 | 購物車 | `/cart` | 加入、修改、移除 |
| C5 | 結帳 | `/checkout` | LINE ID + 寶寶月齡 + Email（M5 備援） |
| C6 | 訂單追蹤 | `/track/[orderId]` | 7 階段進度條 |
| C7 | 會員中心 | `/account` | 個人資料、訂單、購物金 |
| C8 | 推薦中心 | `/account/referrals` | 分潤連結、購物金 |
| C9 | 報價計算機 | `/calculator` | URL → 台灣售價 |
| C10 | 月齡推薦器 | `/recommend` | 互動式問答 |
| C11 | 彌月禮指南 | `/gift-guide` | 預算分級工具 |
| C12 | 關於我們 | `/about` | 品牌故事、法規誠信 |
| C13 | FAQ | `/faq` | 常見問題 |
| C14 | 內容部落格 | `/journal` | 選物觀點、媽媽真心話 |

### 5.2 後台模組（Admin Panel）

| ID | 模組 | 路徑 | 說明 |
|---|---|---|---|
| A1 | 儀表板 | `/admin` | 今日訂單、待處理 |
| A2 | 訂單管理 | `/admin/orders` | OMS：列表、狀態（嚴格轉移）、出貨 |
| A3 | 商品管理 | `/admin/products` | PIM：CRUD、AI 自動建檔 |
| A4 | 客戶管理 | `/admin/customers` | CRM：分群、月齡、LTV |
| A5 | 庫存管理 | `/admin/inventory` | WMS：盤點、揀貨 |
| A6 | 採購管理 | `/admin/purchases` | PMS：採購單、供應商 |
| A7 | 行銷推播 | `/admin/marketing` | LINE 群發、優惠券、Email 群發 |
| A8 | 報表中心 | `/admin/reports` | 銷售、毛利、客戶 LTV |
| A9 | 市場情報 | `/admin/intelligence` | 趨勢、競品、AI 週報 |
| A10 | 設定中心 | `/admin/settings` | 一般設定、整合、權限 |

### 5.3 LINE Bot 模組

| ID | 功能 | 觸發 | 計費 | 🆕 Email 備援 |
|---|---|---|---|---|
| L1 | 加好友歡迎 | 加 LINE 好友 | 免費 | — |
| L2 | 訂單狀態推播 | 訂單狀態變更 | 計費（Push）| ✅ |
| L3 | 自動報價 | 客戶貼商品 URL | 免費（Reply）| — |
| L4 | 客服分流 | 客戶任意訊息 | 免費（Reply）| — |
| L5 | 月齡商品推送 | 寶寶月齡 +1 | 計費（Push）| ✅（可選） |
| L6 | 尾款催繳 | Cron 觸發 | 計費（Push）| ✅ |
| L7 | 出貨通知 | 黑貓收件 | 計費（Push）| ✅ |

> 🆕 **v1.1 Trade-off 說明（L7）**：若 LINE 訊息預算吃緊，L7 可改為「出貨後 24 小時內客戶觸發 Reply 查詢」，省 Push 額度但體驗較差。預設仍走 Push + Email 備援。

---

## 6. 資料庫 Schema

### 6.1 主資料表（共 19 張，含 organizations）

```sql
-- ── 多租戶 ───────────────────────────
organizations          組織（M1，單租戶階段塞一筆預設）

-- ── 認證與使用者 ──────────────────────
users                  使用者帳號（Supabase Auth 管理，僅後台）
customers              客戶資料（前台 LINE Login，自管）
admin_users            後台使用者（你/太太/朋友）

-- ── 商品 ─────────────────────────────
products               商品主檔
product_variants       商品規格（尺寸、顏色）
product_images         商品圖片
categories             分類（含月齡分類）
brands                 品牌

-- ── 訂單 ─────────────────────────────
orders                 訂單主檔
order_items            訂單項目
order_status_logs      狀態變更歷史（強制寫入）

-- ── 庫存與採購 ───────────────────────
inventory              庫存
purchases              採購單
purchase_items         採購項目
suppliers              供應商（SuperDelivery、樂天等）

-- ── 行銷與推薦 ───────────────────────
referral_links         推薦連結
referral_earnings      推薦分潤
store_credits          購物金紀錄
push_logs              推播紀錄（含 LINE + Email 雙通道）

-- ── 市場情報 ─────────────────────────
raw_posts              爬蟲原始資料
cleaned_data           Claude 清理後資料
trends                 趨勢分析結果
competitors            追蹤的競爭對手
intelligence_reports   AI 週報

-- ── 系統 ─────────────────────────────
settings               系統設定
audit_logs             操作稽核
```

> 🆕 **多租戶 `org_id` 欄位（M1 已決議 → 加）**
> 所有業務表（products / orders / customers / inventory / purchases / suppliers / referral_links / store_credits / referral_earnings / push_logs / 市場情報相關表）皆內建 `org_id uuid not null references organizations(id)`。
> 單租戶階段：建立預設 organization 紀錄（例如 `00000000-0000-0000-0000-000000000001`），所有資料填同一個。
> Drizzle helper：所有 query builder 預設帶上 `where org_id = currentOrgId`，避免人工漏掉。RLS 策略也以 `org_id = current_setting('request.jwt.claims', true)::json ->> 'org_id'` 過濾。
> 新增表：`organizations`（id, name, created_at, plan, billing_status...），共 19 張表（原 18 + organizations）。

### 6.2 關鍵欄位設計

#### customers 表（重要）
```typescript
{
  id: uuid,
  org_id: uuid,                    // M1: 多租戶切分
  line_user_id: text (unique),     // LINE Login 取得
  email: text,                     // 🆕 必填，作為 LINE 之外的通知 fallback
  name: text,
  phone: text,
  baby_birth_date: date,            // 寶寶生日（用以計算月齡）
  baby_gender: enum,                // 男/女/不公開
  store_credit: integer (default 0), // 購物金餘額
  store_credit_expire: timestamp,
  referral_code: text (unique),     // 自己的推薦碼
  referred_by: uuid,                // 被誰推薦進來
  total_spent: integer,             // LTV
  total_orders: integer,
  tags: text[],                     // 自由標籤
  is_blacklisted: boolean,          // 黑名單
  notification_prefs: jsonb,       // 🆕 { line: true, email: true }
  created_at, updated_at
}
```

#### orders 表（核心）
```typescript
{
  id: uuid,
  org_id: uuid,                    // M1
  order_number: text (unique),     // 顯示用編號
  customer_id: uuid,
  status: enum (
    'pending_payment',     // 待付款
    'paid',                // 已付款
    'sourcing_jp',         // 日本下單中
    'received_jp',         // 日本到貨
    'shipping_intl',       // 集運中
    'arrived_tw',          // 台灣到港
    'shipped',             // 已出貨
    'completed',           // 已完成
    'cancelled',           // 已取消
    'refunded'             // 已退款
  ),
  // 🆕 v1.1：合法狀態轉移由 OrderService.changeStatus 強制檢查
  // 狀態矩陣詳見 docs/BUSINESS_RULES.md
  payment_method: enum,
  payment_status: enum,
  subtotal: integer,
  shipping_fee: integer,
  tax: integer,
  store_credit_used: integer,
  total: integer,
  ecpay_trade_no: text,            // 綠界交易編號
  shipping_address: jsonb,
  recipient_line_id: text,
  recipient_email: text,           // 🆕 必填（M5）
  baby_age_months: integer,        // 結帳時的寶寶月齡
  notes: text,
  is_preorder: boolean,
  expected_delivery: date,
  cutoff_date: date,                // 預購截單日
  referred_by: uuid,                // 推薦來源
  created_at, updated_at
}
```

#### products 表
```typescript
{
  id: uuid,
  org_id: uuid,                    // M1
  slug: text (unique),             // SEO 友善網址
  name_zh: text,
  name_jp: text,
  brand_id: uuid,
  category_id: uuid,
  description: text,
  use_experience: text,            // ★ 我家娃使用心得（差異化）
  age_range_months: int4range,     // 適合月齡
  price_jpy: integer,              // 日本價
  price_twd: integer,              // 台灣售價
  cost_jpy: integer,               // 進貨成本
  weight_g: integer,
  stock_type: enum ('preorder', 'in_stock'),
  stock_quantity: integer,
  status: enum ('draft', 'active', 'archived'),
  source_url: text,                // 日本來源 URL
  source_platform: enum,           // rakuten/amazon_jp/zozo
  tags: text[],
  seo_title: text,
  seo_description: text,
  view_count: integer,
  sales_count: integer,
  created_at, updated_at
}
```

### 6.3 Drizzle Schema 範例

```typescript
// /db/schema/customers.ts
import { pgTable, uuid, text, integer, date, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core'

export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),  // M1
  lineUserId: text('line_user_id').unique(),
  email: text('email').notNull(),  // 🆕 必填
  name: text('name'),
  phone: text('phone'),
  babyBirthDate: date('baby_birth_date'),
  babyGender: text('baby_gender'),
  storeCredit: integer('store_credit').default(0),
  storeCreditExpire: timestamp('store_credit_expire'),
  referralCode: text('referral_code').unique(),
  referredBy: uuid('referred_by'),
  totalSpent: integer('total_spent').default(0),
  totalOrders: integer('total_orders').default(0),
  isBlacklisted: boolean('is_blacklisted').default(false),
  notificationPrefs: jsonb('notification_prefs').$type<{ line: boolean; email: boolean }>().default({ line: true, email: true }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})
```

### 6.4 🆕 資料存取雙路徑（H1 修正）

> **核心規則**
> - **特權路徑**（後台、webhook、cron、Workers）：Drizzle + service role 連線。RLS 不生效，**應用層自管權限**。
> - **客戶路徑**（前台讀取自己的訂單／資料）：走 `@supabase/supabase-js` + LINE JWT claim，**RLS 自動套用**。
> - **客戶寫入**（加購物車、結帳）：走 Server Action + Drizzle（在 service 層硬編碼 `where customer_id = currentUser.id`）。

#### Drizzle Client 分層

```typescript
// /src/db/client.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// 特權連線（後台、webhook、cron 用）— bypass RLS
const privilegedSql = postgres(process.env.DATABASE_URL!, { max: 10 })
export const db = drizzle(privilegedSql, { schema })

// 客戶連線（如需 RLS）— 帶 JWT context
export function dbForCustomer(jwtClaims: object) {
  const sql = postgres(process.env.DATABASE_URL!, {
    max: 1,
    onnotice: () => {},
    transform: { undefined: null }
  })
  // 每個 query 前 SET LOCAL request.jwt.claims
  return drizzle(sql, { schema })
}
```

#### Supabase Client（客戶端讀取）

```typescript
// /src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // 將 LINE JWT 注入 supabase-js（自訂 claim）
      global: { headers: { Authorization: `Bearer ${getLineJwt()}` } }
    }
  )
}
```

#### RLS 策略範例（生效於客戶路徑）

```sql
-- 客戶只能看自己的訂單（透過 LINE JWT 中的 line_user_id）
CREATE POLICY "Customers can view own orders"
ON orders FOR SELECT
USING (
  customer_id IN (
    SELECT id FROM customers
    WHERE line_user_id = current_setting('request.jwt.claims', true)::json ->> 'line_user_id'
  )
);

-- service_role 全權限（特權路徑）
-- service_role 預設 bypass RLS，無需額外 policy
```

### 6.5 🆕 Schema 單一來源（H3 修正）

> **鐵律**
> - **Schema 唯一來源 = `src/db/schema/*.ts`**。
> - RLS policy、trigger、enum 全部以 SQL migration 檔形式 commit 進 `src/db/migrations/`。
> - **禁止**直接在 Supabase Studio 修改表結構或 policy。
> - CI 中加入 `pnpm drizzle-kit check` 確認 schema 與 migration 一致。
> - 太太、朋友的後台帳號**不要**有 Supabase Studio 寫入權（只給 read-only viewer）。

---

## 7. 外部整合

### 7.1 整合清單

| 服務 | 用途 | API 文件 | 整合時機 |
|---|---|---|---|
| LINE Login | 前台登入 | developers.line.biz | Phase 1a |
| LINE Messaging API | 推播 + Bot | developers.line.biz | Phase 2 |
| 綠界 ECPay | 金流 + 物流 | developers.ecpay.com.tw | Phase 1b |
| 黑貓宅急便 API | 託運單 | tcat.com.tw（**特約 Week 1 申請**）| Phase 4 |
| Anthropic Claude | AI 文案／客服／週報 | docs.anthropic.com | Phase 2 |
| OpenAI | Embedding | platform.openai.com | Phase 5 |
| Cloudflare Images | 圖片優化 | developers.cloudflare.com | Phase 1a |
| Meta Graph API | IG/FB 自動發文 | developers.facebook.com | Phase 5 |
| 樂天 RWS API | 商品資料 | webservice.rakuten.co.jp | Phase 3 |
| Buyee/Tenso | 集運追蹤 | （無公開 API，需爬）| Phase 4 |
| 台銀匯率 API | 匯率 | rate.bot.com.tw | Phase 1a |
| Google Trends | 趨勢資料 | pytrends（非官方） | Phase 5 |
| Sentry | 錯誤追蹤 | sentry.io | Phase 1a |
| 🆕 Resend | 交易郵件（M5 備援） | resend.com | Phase 1b |

### 7.2 環境變數規範

```bash
# /.env.local

# ── Next.js ──────────────────────
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SITE_NAME=日系選物店

# ── Supabase ─────────────────────
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=                       # Drizzle 直連用（serverless 走 pgbouncer port 6543）
DATABASE_URL_DIRECT=                # drizzle-kit migration 用（直連 port 5432）

# ── LINE ─────────────────────────
LINE_LOGIN_CHANNEL_ID=
LINE_LOGIN_CHANNEL_SECRET=
LINE_MESSAGING_CHANNEL_ID=
LINE_MESSAGING_CHANNEL_SECRET=
LINE_MESSAGING_ACCESS_TOKEN=
LINE_OFFICIAL_ID=
LINE_JWT_SECRET=                    # 🆕 自簽 JWT 用（H2）

# ── 綠界 ECPay ───────────────────
ECPAY_MERCHANT_ID=
ECPAY_HASH_KEY=
ECPAY_HASH_IV=
ECPAY_RETURN_URL=
ECPAY_NOTIFY_URL=
ECPAY_ENV=stage                     # stage | production

# ── AI ────────────────────────────
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# ── Cloudflare ────────────────────
CF_ACCOUNT_ID=
CF_IMAGES_TOKEN=
CF_WORKERS_TOKEN=
CF_R2_ACCESS_KEY=                   # 🆕 備份用（L4）
CF_R2_SECRET_KEY=

# ── Email ─────────────────────────
RESEND_API_KEY=                     # 🆕 (M5)
EMAIL_FROM=

# ── 監控 ──────────────────────────
SENTRY_DSN=
SENTRY_AUTH_TOKEN=                  # 僅 build 時用，不可進 client bundle

# ── 公司資訊 ──────────────────────
COMPANY_TAX_ID=60766849
COMPANY_NAME=
```

---

## 8. 專案目錄結構

```
nihon-select/
├── README.md
├── ARCHITECTURE.md            ← 本文件
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
├── .env.local
├── .env.example
├── .gitignore
│
├── src/
│   ├── app/                              ← Next.js App Router
│   │   │
│   │   ├── (marketing)/                  ← 行銷頁面群組
│   │   │   ├── page.tsx                  ← 首頁
│   │   │   ├── about/page.tsx
│   │   │   ├── faq/page.tsx
│   │   │   └── journal/
│   │   │
│   │   ├── (shop)/                       ← 購物頁面群組
│   │   ├── (account)/                    ← 會員頁面群組
│   │   ├── (tools)/                      ← 鉤子工具
│   │   ├── admin/                        ← 後台（Supabase Auth 守門）
│   │   │
│   │   ├── api/
│   │   │   ├── webhooks/
│   │   │   │   ├── ecpay/route.ts        ← 綠界 webhook
│   │   │   │   ├── line/route.ts         ← LINE Bot webhook
│   │   │   │   └── tcat/route.ts         ← 黑貓回傳
│   │   │   ├── trpc/[trpc]/route.ts
│   │   │   └── internal/                 ← 🆕 給 CF Workers 呼叫的 internal API
│   │   │       └── cron/
│   │   │           ├── update-baby-ages/route.ts
│   │   │           └── send-payment-reminders/route.ts
│   │   │
│   │   ├── auth/
│   │   │   ├── line/route.ts             ← LINE Login callback（自簽 JWT）
│   │   │   └── logout/route.ts
│   │   │
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── not-found.tsx
│   │
│   ├── components/                       ← React 元件
│   ├── server/                           ← Server-side 邏輯
│   │   ├── actions/                      ← Server Actions
│   │   ├── trpc/                         ← tRPC routers
│   │   └── services/                     ← 業務邏輯層
│   │       ├── OrderService.ts           ← 含 changeStatus 狀態機檢查
│   │       ├── ProductService.ts
│   │       ├── CustomerService.ts
│   │       ├── InventoryService.ts
│   │       ├── PurchaseService.ts
│   │       ├── NotificationService.ts    ← 🆕 LINE + Email 雙通道
│   │       ├── PricingService.ts
│   │       ├── AIService.ts
│   │       └── IntelligenceService.ts
│   │
│   ├── db/
│   │   ├── schema/
│   │   ├── migrations/                   ← drizzle-kit 產出（含 RLS SQL）
│   │   ├── seed.ts
│   │   └── client.ts                     ← 含 db (privileged) 與 dbForCustomer
│   │
│   ├── integrations/                     ← 外部 API 包裝
│   │   ├── line/
│   │   │   ├── login.ts                  ← OAuth callback
│   │   │   ├── jwt.ts                    ← 🆕 自簽 JWT
│   │   │   ├── messaging.ts
│   │   │   └── webhook-verify.ts
│   │   ├── ecpay/
│   │   ├── ai/
│   │   ├── cloudflare/
│   │   │   ├── images.ts
│   │   │   └── r2.ts                     ← 🆕 備份儲存
│   │   ├── tcat/
│   │   ├── exchange-rate/
│   │   └── email/                        ← 🆕 Resend 包裝
│   │       └── resend.ts
│   │
│   ├── lib/
│   ├── hooks/
│   ├── stores/
│   ├── types/
│   ├── styles/
│   └── middleware.ts
│
├── workers/                              ← 🆕 整合的 Cloudflare Workers
│   ├── scrapers/                         ← 爬蟲
│   ├── pipeline/                         ← Claude 清理 + Embedding
│   ├── crons/                            ← 🆕 排程任務（取代 Vercel Cron）
│   │   ├── update-baby-ages.ts
│   │   ├── send-payment-reminders.ts
│   │   ├── generate-weekly-report.ts
│   │   └── backup-db.ts                  ← pg_dump 到 R2
│   └── wrangler.toml
│
├── tests/
│
├── docs/                                 ← 補充文件
│   ├── BUSINESS_RULES.md                 ← 業務規則 + 訂單狀態轉移矩陣（H4）
│   ├── CONVENTIONS.md                    ← 🆕 Server Actions vs tRPC 邊界（L1）
│   ├── PRICING_FORMULA.md
│   ├── LEGAL_GUIDE.md
│   ├── BRAND_GUIDE.md
│   ├── DEPLOYMENT.md
│   ├── INTELLIGENCE.md
│   ├── PRODUCT_SELECTION.md
│   ├── LINE_TEMPLATES.md
│   ├── PARTNERSHIP.md
│   └── SAAS_ROADMAP.md
│
└── scripts/
    ├── seed-products.ts
    └── backup-db.ts
```

---

## 9. 開發 Phase 規劃

> 🆕 **v1.1 重大調整（H6）**：Phase 1 由 4 週擴成 7 週，分 1a / 1b / 1c。Week 1 同步啟動行政流程（M2）。

### 行政流程（Week 1 啟動，與開發並行）

- [ ] 申請黑貓 API 特約（4–8 週審核，Phase 4 才整合）
- [ ] 申請綠界正式商家（與測試 sandbox 不同）
- [ ] 申請 LINE 官方帳號認證（綠盾）
- [ ] 申請 Cloudflare Images / R2 帳號
- [ ] 申請 Anthropic / OpenAI API key（含 billing）
- [ ] 申請 Resend / 設定發信網域 SPF/DKIM

### Phase 1a：商品瀏覽 + 後台 CRUD（週 1–3）

**目標**：太太可以開始上 30 件選品；前台可瀏覽（無金流）。

```
Week 1：基礎建設
├ 環境建置（Next.js + Supabase + Vercel + Cloudflare）
├ Drizzle ORM 設定 + Schema 第一版（[DECISION-M1] 視決策加 org_id）
├ 後台登入（Supabase Auth）
├ LINE Login（自簽 JWT，customers 表）
└ 行政流程啟動（見上）

Week 2：商品瀏覽
├ 首頁（Hero + 商品列表）
├ 商品列表頁（含篩選）
├ 商品詳情頁
├ 基本佈局（Header / Footer / 商品卡）
└ 後台商品 CRUD（讓太太能開始上架）

Week 3：商品管理升級
├ 多圖管理 + Cloudflare Images（M6 工作流）
├ 多規格、上下架
├ 30 件選品 seed 灌入
└ 1a 內測
```

### Phase 1b：金流 + 訂單（週 4–6）

**目標**：能收錢、能出貨；訂單追蹤穩定。

```
Week 4：購物車 + 結帳
├ 購物車（Zustand store + 持久化）
├ 結帳頁（LINE ID + 寶寶月齡 + Email）
└ Resend 整合（訂單建立寄信）

Week 5：綠界整合
├ 綠界金流串接（測試 sandbox）
├ Webhook 處理 + Idempotency key
├ 訂單建立 + 競態條件處理
└ OrderService.changeStatus 狀態機

Week 6：訂單追蹤
├ 訂單追蹤頁（簡易 7 階段）
├ 後台訂單列表 + 狀態變更
├ order_status_logs 強制寫入
└ Beta 接單（親友、純線下通知）
```

### Phase 1c：流量鉤子（週 7）

```
Week 7：報價計算機（鉤子 #1）
├ /calculator 頁
├ 台銀匯率 API 整合
└ 上線測試
```

### Phase 2：自動化基礎（週 8–11）

```
Week 8：LINE 自動化
├ LINE Messaging API 整合
├ 訂單狀態變更 → 自動推播 + Email 備援
├ 7 階段進度通知模板
└ 加好友自動回覆

Week 9：訂單追蹤強化
├ 進度條 UI（7 階段）
├ 自動催繳尾款（CF Workers Cron）
├ 逾期自動取消
└ 月齡推薦器（鉤子 #2）

Week 10：商品多規格與排程
├ 上下架排程
├ 現貨/預購雙軌
└ AI 商品建檔（貼日本網址 → 自動爬資料）

Week 11：彌月禮指南（鉤子 #3）
├ 預算分級工具
└ 內容部落格雛型
```

### Phase 3：差異化武器（週 12–15）

```
Week 12：LINE Bot 報價系統（鉤子 #4 — Bot 介面）
Week 13：分潤推薦系統
Week 14：寶寶月齡分群推播
Week 15：AI 客服分流
```

### Phase 4：規模化營運（週 16–19）

```
Week 16：倉儲管理 WMS
Week 17：採購管理 PMS
Week 18：物流串接（黑貓，前提：特約已過）
Week 19：報表儀表板 + Realtime 開啟
```

### Phase 5：市場情報系統（週 20–23）

```
Week 20：基礎爬蟲（PTT + Trends）+ AI 週報
Week 21：互動式儀表板 + 進貨建議
Week 22：競品追蹤 + 商品頁情報指標
Week 23：Embedding 分群 + 個人化推薦
```

### Phase 6：AI 進階（持續，視 [DECISION-M1] 決定 SaaS 路線）

```
- AI Agent 半自動採購（Claude 草擬 → 朋友確認 → 人工下單，再評估全自動）
- 銷售預測
- 內容自動化（IG/Threads 自動發文）
- [若 SaaS 化] 多租戶切割、計費系統、客戶 onboarding
```

---

## 10. 環境設定

### 10.1 開發環境準備

```bash
# 1. Node.js 20+ LTS
node --version

# 2. pnpm
npm install -g pnpm

# 3. Git
git --version

# 4. Vercel CLI（選用）
npm i -g vercel

# 5. Cloudflare Wrangler（Workers + Cron + 爬蟲）
npm i -g wrangler
```

### 10.2 專案初始化指令

```bash
pnpm create next-app@latest nihon-select \
  --typescript --tailwind --eslint --app --src-dir --turbopack \
  --import-alias "@/*"

cd nihon-select

# 核心依賴
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit
pnpm add @trpc/server @trpc/client @trpc/react-query @trpc/next
pnpm add @tanstack/react-query
pnpm add zod next-safe-action
pnpm add ai @ai-sdk/anthropic @ai-sdk/openai
pnpm add @line/bot-sdk
pnpm add jose                              # 🆕 LINE 自簽 JWT
pnpm add resend                            # 🆕 Email
pnpm add zustand date-fns
pnpm add @sentry/nextjs

pnpm dlx shadcn@latest init
pnpm add -D @types/node vitest @vitejs/plugin-react
```

### 10.3 資料庫初始化

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
pnpm tsx scripts/seed-products.ts
```

---

## 11. 部署架構

### 11.1 服務部署位置

| 服務 | 平台 | 部署方式 |
|---|---|---|
| 主應用（Web + Admin）| Vercel | Git push 自動部署 |
| 資料庫 | Supabase | 託管 |
| 排程 + 爬蟲 + Pipeline | Cloudflare Workers | wrangler deploy |
| 圖片 CDN | Cloudflare Images | API |
| 備份儲存 | Cloudflare R2 | API |
| DNS | Cloudflare | 託管 |
| 網域 | Cloudflare Registrar | 託管 |

### 11.2 環境分層

```
Local：    Supabase 開發專案 + LINE/綠界 sandbox + Anthropic dev key
Staging：  Vercel Preview + Supabase 測試專案 + sandbox 帳號
Production：Vercel Prod + Supabase 正式 + 正式帳號
```

### 11.3 CI/CD 流程

```
push → GitHub Actions
  ├ ESLint
  ├ TypeScript 檢查
  ├ Vitest 單元測試
  ├ drizzle-kit check（🆕 schema/migration 一致性）
  └ secret scan
  ↓
Vercel 自動部署（Preview / Production）
  ↓
Sentry 監控啟動
  ↓
（夜間）CF Workers backup-db cron → R2
```

---

## 12. 安全與權限

### 12.1 認證流程（🆕 v1.1 雙軌設計）

```
─── 前台客戶 ───
LINE Login OAuth
  → 取得 LINE userId、display name、email（若同意）
  → 建立/更新 customers 紀錄
  → 自簽 JWT（jose, HS256, LINE_JWT_SECRET, 7 天）
  → 寫入 httpOnly cookie（SameSite=Lax）
  → 後續請求 middleware 驗證 JWT
  → supabase-js client 攜帶該 JWT 作為 Authorization

─── 後台使用者 ───
Supabase Auth（email + password + MFA）
  ├ 你（owner role）
  ├ 太太（admin role）
  └ 朋友（partner role）

兩套 cookie 不共用（不同 domain path 或 prefix）
```

### 12.2 權限矩陣

| 功能 | 客戶 | 朋友 | 太太 | 你 |
|---|---|---|---|---|
| 自己的訂單 | ✅ | — | — | — |
| 看所有訂單 | ❌ | ✅ | ✅ | ✅ |
| 改訂單狀態 | ❌ | ❌ | ✅ | ✅ |
| 商品 CRUD | ❌ | ❌ | ✅ | ✅ |
| 採購單 | ❌ | ✅ | ❌ | ✅ |
| 客戶資料 | ❌ | ❌ | ✅ | ✅ |
| 市場情報儀表板 | ❌ | ✅ | ✅ | ✅ |
| 修改設定 | ❌ | ❌ | ❌ | ✅ |
| 財務報表 | ❌ | ❌ | ❌ | ✅ |
| Supabase Studio 寫入 | ❌ | ❌ | ❌ | 🆕 ❌（H3） |

### 12.3 安全檢查清單

- [ ] 所有環境變數**不進 Git**
- [ ] 綠界 HashKey/HashIV **只在 Server 端**
- [ ] Webhook 驗證 signature（綠界 + LINE 雙端）
- [ ] Supabase RLS **客戶路徑啟用**（特權路徑 service_role bypass）
- [ ] LINE webhook signature 驗證
- [ ] Server Action 用 next-safe-action 包裝
- [ ] Zod 驗證所有 user input
- [ ] Idempotency key 處理重複 webhook（綠界、LINE、tcat）
- [ ] Rate limit 重要 API（報價計算機、LINE Bot Reply）
- [ ] HTTPS only（Cloudflare 自動）
- [ ] CSRF 保護（Next.js 內建 + Origin check）
- [ ] 🆕 訂單狀態轉移以 lookup table 強制（OrderService）
- [ ] 🆕 Schema 變更只能透過 drizzle-kit migration（CI 檢查）
- [ ] 🆕 Email fallback 通知失敗時記 Sentry

---

## 13. 監控與分析

### 13.1 監控指標

**技術指標**：
- 錯誤率（Sentry）
- API 響應時間（Vercel）
- 資料庫慢查詢（Supabase）
- LINE 推播失敗率
- 🆕 Email 發送失敗率（Resend）
- 🆕 Workers Cron 執行成功率

**業務指標**：
- 日訂單數、營業額
- 跑單率、退款率
- 客戶 LTV
- 廣告 ROAS（後期）

**體驗指標**：
- 結帳轉換率
- 加入購物車到結帳的漏斗
- 報價計算機使用次數
- LINE Bot 報價成功率

### 13.2 警報設定

```
Critical（立即通知 LINE）：
- 網站 down
- 綠界 webhook 失敗
- 資料庫連線失敗
- 重要訂單付款失敗
- 🆕 LINE + Email 雙通道同時失敗

Warning（每日彙整）：
- LINE 推播失敗 > 5%
- 任一頁面錯誤率 > 1%
- 庫存低於閾值
- 跑單率異常上升
- 🆕 訂單狀態非法轉移嘗試（OrderService throw 的計數）
```

---

## 14. 成本估算

### 14.1 月固定成本

| 階段 | 服務 | 費用 |
|---|---|---|
| **起步** | Vercel | 免費（cron 已移到 Workers） |
| | Supabase | 免費（注意 7 天暫停）|
| | Cloudflare Workers | 免費（10 萬 req/日） |
| | Cloudflare R2 | 免費（10GB）|
| | LINE | 免費 200 則（見 14.3 試算）|
| | Claude API | NT$500–1,500 |
| | OpenAI | NT$500 |
| | Resend | 免費（3,000 封/月） |
| | 網域 | NT$33 |
| | **小計** | **NT$1,000–2,000** |
| **規模化** | Vercel Pro | USD 20 ≈ NT$650 |
| | Supabase Pro | USD 25 ≈ NT$800 |
| | Cloudflare Images | USD 5 ≈ NT$165 |
| | LINE 輕用量 | NT$1,200 |
| | Claude API | NT$3,000 |
| | OpenAI | NT$1,500 |
| | Resend Pro | USD 20 ≈ NT$650 |
| | Sentry | 免費或 USD 26 |
| | **小計** | **NT$8,000–9,500** |

### 14.2 變動成本

- 綠界手續費：信用卡 2.89%、ATM 1%、超商 15 元起
- LINE 加購訊息：NT$0.2/則起
- 黑貓宅配：依重量

### 14.3 🆕 LINE 訊息預算試算（M3）

每張訂單估計 push 數：
- L2 已付款 1 + L2 日本到貨 1 + L2 台灣到港 1 + L7 出貨 1 = **4 則/訂單**
- 加 L6 催繳（部分訂單）平均 0.3 則
- 加 L5 月齡推送（會員，每月 1 則）

| 月訂單數 | 訂單推播 | 行銷推播 | 合計 | 是否破免費 200 則 |
|---|---|---|---|---|
| 20 | 86 | ~50 | ~136 | ✅ 在免費內 |
| 50 | 215 | ~150 | ~365 | ❌ 破，需輕用量 NT$1,200 |
| 100 | 430 | ~300 | ~730 | ❌ 輕用量勉強 |
| 200+ | 860+ | ~600+ | 1,460+ | 需中用量方案 |

> **建議**：
> - 月訂單 ≥ 50 即升輕用量方案。
> - L5 月齡推送可以「批次推一個月一次」而非每月每客戶各一則，省額度。
> - L6 催繳優先 Email + LINE Reply 互動，不主動 Push。

---

## 15. 文件清單

### 15.1 應建立的補充文件

```
docs/
├── BUSINESS_RULES.md         🆕 含訂單狀態轉移矩陣（H4）
├── CONVENTIONS.md            🆕 Server Actions vs tRPC 邊界（L1）
├── PRICING_FORMULA.md
├── LEGAL_GUIDE.md
├── BRAND_GUIDE.md
├── PRODUCT_SELECTION.md
├── LINE_TEMPLATES.md
├── INTELLIGENCE.md
├── DEPLOYMENT.md
├── PARTNERSHIP.md
└── SAAS_ROADMAP.md           ✅ 保留（M1 已決議多租戶）
```

### 15.2 既有資料整合

- ✅ 30 件選品清單（已有 .md 檔）
- ⏳ 完整商業計畫書（已產出 artifact）
- ⏳ 系統圖視覺版（已產出 HTML）

---

## 16. v1.1 變更紀錄

| 修正 ID | 主題 | 影響範圍 | 狀態 |
|---|---|---|---|
| H1 | Drizzle 雙路徑（特權 / 客戶） | §3.1, §6.4 | ✅ 已併入 |
| H2 | LINE Login + Supabase Auth 雙軌 | §3.1, §12.1 | ✅ 已併入 |
| H3 | Schema 單一來源 | §6.5, §12.3 | ✅ 已併入 |
| H4 | 訂單狀態轉移矩陣 | §6.2, docs/BUSINESS_RULES.md | ✅ 已併入 |
| H5 | Cron 移到 CF Workers | §3.1, §8, §11.1 | ✅ 已併入 |
| H6 | Phase 1 切成 1a/1b/1c | §9 | ✅ 已併入 |
| M1 | 多租戶 org_id | §6.1, §6.2, §6.3 | ✅ 已決議：加（SaaS 機率 ≥ 30%） |
| M2 | Week 1 行政流程 | §9 | ✅ 已併入 |
| M3 | LINE 訊息預算試算 | §14.3 | ✅ 已併入 |
| M4 | 移除 Supabase Edge Functions | §3.1, §3.2, §4.2 | ✅ 已併入 |
| M5 | Resend Email 備援 | §3.1, §5.3, §6.2, §7 | ✅ 已併入 |
| M6 | Cloudflare Images 上傳工作流 | §9 (Phase 1a Week 3) | ✅ 已併入 |
| L1 | Server Actions vs tRPC 邊界 | docs/CONVENTIONS.md | ✅ 已併入 |
| L2 | Realtime 啟用時機 | §3.1, §9 (Phase 4) | ✅ 已併入 |
| L3 | Computer Use 風險 | §9 (Phase 6) | ✅ 已併入 |
| L4 | 自動備份 | §11.3, §3.1 | ✅ 已併入 |
| L5 | i18n 欄位設計 | §6.2 | ⏳ 暫保留 name_zh/name_jp |

---

## 結語

這份文件是專案的**單一資訊來源（Single Source of Truth）**，所有開發決策應以此為準。

### 開發紀律
1. **每週上線一次**新功能
2. **TypeScript 全強型別**
3. **資料庫遷移用 Drizzle Migration**（禁止 Supabase Studio 改 schema）
4. **API 版本控制**
5. **錯誤都要記 Sentry**
6. **Phase 結束做資料備份**（夜間 cron 自動 + 手動快照）

### 下一步行動
1. ✅ ~~拍板 M1：所有業務表加 `org_id`~~（已決議）
2. 在現有資料夾 `/Users/lichenghan/日系選物店/` 執行 `git init`
3. 執行 `pnpm create next-app@latest`（注意：不要覆寫現有 ARCHITECTURE.md / docs/）
4. 啟動 Week 1 行政流程（黑貓特約、綠界正式商家、LINE 認證）
5. 按 Phase 1a Week 1 的清單開始

---

**版本紀錄**

| 版本 | 日期 | 變更 |
|---|---|---|
| v1.0 | 2026-05-02 | 初版，整合所有討論內容 |
| v1.1 | 2026-05-02 | 整合 H1–H6 高優先、M1–M6 中優先、L1–L5 低優先審查修正 |
