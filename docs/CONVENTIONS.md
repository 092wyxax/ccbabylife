# 開發慣例

> 本文件規範 Server Actions、tRPC、RSC、資料存取的使用邊界，以及命名與程式碼風格。
> 修改本文件需先在團隊（先生 + 太太 + 朋友）達成共識。

---

## 1. API 層級邊界（L1 修正）

### 1.1 何時用 Server Action（next-safe-action）

**用於：表單提交與帶副作用的單一動作**

- `addToCart`, `removeFromCart`, `updateCartItem`
- `checkout` → 建立訂單、呼叫綠界
- `updateProfile`, `bindLineLogin`
- 後台：`createProduct`, `updateOrderStatus`, `uploadProductImage`

**特徵**：
- 一次請求做一件事，回傳成功或失敗
- 不需要前端複雜的快取、樂觀更新
- 表單可直接 `<form action={serverAction}>`

```typescript
// 範例：src/server/actions/checkout.ts
'use server'
import { actionClient } from '@/lib/safe-action'
import { z } from 'zod'

const schema = z.object({
  cartItems: z.array(...),
  recipientLineId: z.string(),
  recipientEmail: z.string().email(),
  babyAgeMonths: z.number().min(0).max(120)
})

export const checkout = actionClient
  .schema(schema)
  .action(async ({ parsedInput, ctx }) => {
    return await OrderService.create(parsedInput, ctx.customer)
  })
```

---

### 1.2 何時用 tRPC

**用於：後台複雜查詢（含篩選、排序、分頁、即時更新）**

- `admin.orders.list`（多條件篩選 + cursor 分頁）
- `admin.customers.search`
- `admin.intelligence.trends.byCategory`
- `admin.reports.salesByMonth`

**特徵**：
- 前端需要 TanStack Query 的快取、refetch、optimistic update
- 多個元件共享同一份資料
- 後台儀表板的 widgets

```typescript
// 範例：src/server/trpc/routers/orders.ts
export const ordersRouter = router({
  list: adminProcedure
    .input(z.object({
      status: z.enum([...]).optional(),
      cursor: z.string().optional(),
      limit: z.number().default(20)
    }))
    .query(async ({ input, ctx }) => {
      return await OrderService.list(input, ctx.adminUser)
    })
})
```

---

### 1.3 何時用 RSC + 直接 await Drizzle

**用於：前台簡單讀取，純展示**

- `/shop` 商品列表
- `/shop/[slug]` 商品詳情
- `/about`, `/faq` 等靜態內容
- `/track/[orderId]` 訂單追蹤頁（首次載入）

**特徵**：
- 不需要 client-side 狀態
- SEO 需要直出 HTML
- 不在乎與其他 client 元件共享資料

```typescript
// 範例：src/app/(shop)/shop/[slug]/page.tsx
export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await db.query.products.findFirst({
    where: eq(products.slug, params.slug),
    with: { images: true, brand: true }
  })
  if (!product) notFound()
  return <ProductDetail product={product} />
}
```

---

### 1.4 何時用 supabase-js client

**用於：前台需要客戶 JWT + RLS 自動把關的讀取**

- 客戶在 `/account/orders` 看自己訂單列表
- 客戶在 `/track/[orderId]` 即時看狀態變更（Realtime，Phase 4 後）

```typescript
// 範例：src/app/(account)/account/orders/page.tsx
'use client'
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
// RLS 自動限制只回傳該客戶的訂單
```

> 後台**不要**用 supabase-js client，全部走 tRPC + Drizzle service role。

---

## 2. 資料存取守則（H1 修正）

| 路徑 | 使用 | RLS | 範例 |
|---|---|---|---|
| 後台 query | Drizzle (service role) | bypass | `db.query.orders.findMany()` |
| Webhook 處理 | Drizzle (service role) | bypass | 綠界 webhook 建立訂單 |
| Cron / Worker | Drizzle (service role) | bypass | 月齡更新 |
| 客戶寫入（Server Action） | Drizzle (service role) | bypass，**手動 where customer_id** | `addToCart` |
| 客戶讀取（前台） | supabase-js (anon + JWT) | **生效** | `account/orders` |
| RSC 公開資料 | Drizzle (service role) | bypass | 商品列表（公開） |

> **絕不**將 `SUPABASE_SERVICE_ROLE_KEY` 或 `DATABASE_URL` 暴露到客戶端。

---

## 3. Schema 變更流程（H3 修正）

1. 修改 `src/db/schema/*.ts`
2. `pnpm drizzle-kit generate` 產生 migration SQL
3. **人工檢查 migration SQL**（特別是 RLS、index）
4. 必要時手動編輯 migration（例如加 RLS policy）
5. `pnpm drizzle-kit migrate` 套用到 Supabase
6. commit schema + migration 一起進 Git
7. CI 跑 `drizzle-kit check` 驗證

**禁止**：
- 直接在 Supabase Studio 改 schema、加欄位、改 policy
- 跳過 migration 直接 `ALTER TABLE`
- 把 generated migration 改名或刪除已 apply 過的 migration

---

## 4. 命名與檔案結構

### 4.1 路徑慣例
- 元件：`src/components/{shop|admin|tools|shared}/PascalCase.tsx`
- Server Actions：`src/server/actions/{domain}.ts`
- tRPC routers：`src/server/trpc/routers/{domain}.ts`
- Services：`src/server/services/{Domain}Service.ts`
- Drizzle schema：`src/db/schema/{table}.ts`
- 整合：`src/integrations/{vendor}/`

### 4.2 變數命名
- 資料庫欄位：`snake_case`（Drizzle column 的 SQL 名稱）
- TypeScript 程式碼：`camelCase`（Drizzle column 的 JS 屬性名）
- 元件：`PascalCase`
- 環境變數：`SCREAMING_SNAKE_CASE`

### 4.3 業務型別
- 訂單狀態 enum 集中在 `src/types/order.ts`
- Zod schemas 集中在 `src/lib/validators.ts`

---

## 5. Server-only / Client 邊界

- 含 secret 的檔案（service role key、ECPay HashKey、JWT secret）→ `src/server/` 或 `src/integrations/`，且開頭加 `import 'server-only'`
- 客戶端 import 這類檔案會在 build 時報錯
- `src/components/` 預設可被 client 載入；若元件用了 `useState` 等 client API，加 `'use client'`

---

## 6. Commit 訊息

採用 Conventional Commits：

```
feat(order): add status transition validation
fix(checkout): handle ECPay duplicate webhook
chore(deps): bump @line/bot-sdk to 9.x
docs: update ARCHITECTURE for v1.1 review
refactor(db): split client into privileged and customer paths
```

prefix 使用：`feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`

---

## 7. 測試守則

- **Unit test**（Vitest）：`PricingService` 等純邏輯函式必測
- **Integration test**：webhook 處理、訂單狀態機（轉移合法性窮舉）必測
- **E2E test**（Playwright，Phase 4 後）：結帳路徑、LINE Login 路徑必測
- **不寫**為了測而測的測試（無新需求覆蓋的 100% coverage 目標）
