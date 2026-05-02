# nihon-select / 日系選物店

預購制日系母嬰／寵物選物店。詳細架構請見 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 文件導覽

- 架構：[ARCHITECTURE.md](./ARCHITECTURE.md)
- 業務規則 + 訂單狀態機：[docs/BUSINESS_RULES.md](./docs/BUSINESS_RULES.md)
- 開發慣例：[docs/CONVENTIONS.md](./docs/CONVENTIONS.md)
- 部署 SOP：[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- 法規地雷：[docs/LEGAL_GUIDE.md](./docs/LEGAL_GUIDE.md)
- 定價公式：[docs/PRICING_FORMULA.md](./docs/PRICING_FORMULA.md)
- 品牌指南：[docs/BRAND_GUIDE.md](./docs/BRAND_GUIDE.md)
- LINE 訊息模板：[docs/LINE_TEMPLATES.md](./docs/LINE_TEMPLATES.md)
- 30 件選品骨架：[docs/PRODUCT_SELECTION.md](./docs/PRODUCT_SELECTION.md)
- 市場情報系統：[docs/INTELLIGENCE.md](./docs/INTELLIGENCE.md)
- 三人合夥協議：[docs/PARTNERSHIP.md](./docs/PARTNERSHIP.md)
- SaaS 路線圖：[docs/SAAS_ROADMAP.md](./docs/SAAS_ROADMAP.md)

## 初次設定

1. 複製環境變數範本：
   ```bash
   cp .env.example .env.local
   ```
   然後填入 Supabase / LINE / 綠界 / Anthropic / OpenAI / Resend 等 keys。

2. 建立 Supabase 專案（dev / staging / prod 各一），取得 `DATABASE_URL` 與 keys。

3. 產 migration 與套用：
   ```bash
   pnpm db:generate
   pnpm db:migrate
   pnpm db:seed       # 灌入預設 organization
   ```

4. 啟動開發：
   ```bash
   pnpm dev
   ```

## 常用指令

```bash
pnpm dev              # 啟動開發伺服器
pnpm build            # 產生 production build
pnpm typecheck        # TypeScript 檢查
pnpm test             # 跑單元測試 (vitest)
pnpm lint             # ESLint
pnpm db:generate      # 產 Drizzle migration
pnpm db:migrate       # 套用 migration 到 DB
pnpm db:check         # 驗證 schema 與 migration 一致
pnpm db:studio        # 開 Drizzle Studio
pnpm db:seed          # 灌入預設組織 + 8 件 sample 商品
pnpm admin:create     # 建立後台帳號（需傳參，見下方）
```

## 建立第一個後台帳號

```bash
pnpm admin:create you@example.com 'YourPassword123' '你的名字' owner
```

第三個參數 role 可選 `owner` / `admin` / `partner`（預設 owner）。

之後到 `http://localhost:3000/admin/login` 用這組 email + 密碼登入。

## 開發紀律

- **Schema 唯一來源** = `src/db/schema/*.ts`，禁止在 Supabase Studio 改 schema（H3）
- **資料存取雙路徑**：後台 / 寫入用 Drizzle (service role)；前台讀取走 supabase-js + RLS（H1）
- **訂單狀態機**：`src/lib/order-state-machine.ts` 強制檢查（H4）
- **多租戶**：所有業務表內建 `org_id`（M1）

## 階段

目前在 **Phase 1a（週 1–3）**：商品瀏覽 + 後台 CRUD。
完整路徑表見 [ARCHITECTURE.md §9](./ARCHITECTURE.md#9-開發-phase-規劃)。
