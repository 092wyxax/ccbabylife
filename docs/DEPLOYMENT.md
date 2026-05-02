# 部署 SOP

> 從本機開發到生產環境的部署流程。
> 對應 ARCHITECTURE.md §11。

---

## 1. 環境清單

| 環境 | 用途 | 觸發 |
|---|---|---|
| Local | 開發 | `pnpm dev` |
| Preview | PR 預覽 | Git PR 自動 |
| Staging | 整合測試（自由 push） | 推 `develop` 分支 |
| Production | 正式 | 推 `main` 分支 |

---

## 2. 首次部署設定

### 2.1 Supabase

1. 在 supabase.com 建 3 個專案：`nihon-select-dev`、`nihon-select-staging`、`nihon-select-prod`
2. 每個專案：
   - 取得 `URL` / `anon key` / `service_role key` / `DATABASE_URL` / `DATABASE_URL_DIRECT`
   - 開啟 Realtime（Phase 4 才用，先打開不會有費用）
   - **關閉**所有 admin 之外的 Studio 寫入權（H3 鐵律）

### 2.2 Vercel

1. Import GitHub repo
2. Production branch = `main`
3. 在 Project Settings → Environment Variables 設定：
   - 三組環境（Production / Preview / Development）
   - 從 `.env.example` 對照填入
   - **不要**勾「Production 也用 Preview key」（避免測試資料污染正式）
4. 設定 custom domain（Cloudflare DNS 指過來）

### 2.3 Cloudflare

1. DNS 加 `A` / `CNAME` 指 Vercel
2. Cloudflare Images 開啟，取 `IMAGES_TOKEN`
3. R2 建 bucket `nihon-select-backups`
4. Workers：用 wrangler 部署 `workers/` 目錄
   ```bash
   cd workers
   wrangler deploy
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   wrangler secret put ANTHROPIC_API_KEY
   ```

### 2.4 LINE

1. 在 developers.line.biz 建兩個 channel：
   - LINE Login channel（前台用）
   - Messaging API channel（後台 Bot + 推播）
2. 取得各自 `CHANNEL_ID` / `CHANNEL_SECRET` / `ACCESS_TOKEN`
3. 設定 Login callback URL：
   - `https://your-domain.com/auth/line/callback`
   - 加上 staging / preview URL（用 Vercel 的 wildcard）
4. 設定 Messaging API webhook URL：
   - `https://your-domain.com/api/webhooks/line`

### 2.5 綠界 ECPay

1. 申請正式商家帳號（非 sandbox）
   - 需公司行號（統編 60766849）+ 銀行帳戶
   - 審核 1–2 週
2. 取得 `MERCHANT_ID` / `HASH_KEY` / `HASH_IV`
3. 設定回傳 URL：
   - 結帳完成（client redirect）：`/checkout/success`
   - 付款結果通知（server-to-server）：`/api/webhooks/ecpay`

### 2.6 Resend

1. 在 resend.com 註冊
2. 加 domain，依指示設 SPF / DKIM
3. 確認可發信給 gmail / yahoo（不進垃圾匣）
4. 取得 `RESEND_API_KEY`，設 `EMAIL_FROM=noreply@your-domain.com`

---

## 3. 日常部署流程

### 3.1 Feature Branch → Preview
```bash
git checkout -b feat/cart-improvements
# ...開發...
pnpm test
pnpm build       # 本地驗證
git push origin feat/cart-improvements
# 開 PR，Vercel Preview 自動建立
```

### 3.2 Merge → Staging（develop）
```bash
git checkout develop
git merge feat/cart-improvements
git push origin develop
# Vercel Staging 部署
```

### 3.3 Staging → Production（main）
```bash
git checkout main
git merge develop
git push origin main
# Vercel Production 部署
```

---

## 4. Schema Migration 部署（H3 鐵律）

```bash
# 1. 修 src/db/schema/*.ts
# 2. 產 migration
pnpm drizzle-kit generate

# 3. 人工 review src/db/migrations/00XX_xxx.sql
#    - 加 RLS policy
#    - 加必要 index

# 4. 套用到 staging
DATABASE_URL_DIRECT=$STAGING_URL pnpm drizzle-kit migrate

# 5. 在 staging 驗證

# 6. 套用到 production
DATABASE_URL_DIRECT=$PROD_URL pnpm drizzle-kit migrate

# 7. commit migration 進 main
git push origin main
```

> ⚠ migration 一旦 apply 就 **commit 進 Git，不可改檔名、不可刪除**。需要修正用新的 migration。

---

## 5. CF Workers 部署

```bash
cd workers/

# 開發
wrangler dev

# 部署
wrangler deploy --env staging
wrangler deploy --env production
```

`wrangler.toml` 範例：

```toml
name = "nihon-select-workers"
main = "src/index.ts"

[env.staging]
vars = { ENV = "staging" }
[[env.staging.triggers.crons]]
cron = "0 18 * * *"  # 每日 02:00 台灣時間

[env.production]
vars = { ENV = "production" }
[[env.production.triggers.crons]]
cron = "0 18 * * *"
```

---

## 6. 災難復原

### 6.1 程式碼 rollback

```bash
# Vercel UI → Deployments → 選舊版 → Promote to Production
# 或 git revert 後 push
```

### 6.2 資料庫復原

- Supabase Pro：PITR 介面點選時間點
- Supabase Free：每日備份保留 7 天
- 自家備份（CF R2）：用 `pg_restore` 從 R2 下載

```bash
# 取備份
aws s3 cp s3://nihon-select-backups/2026-05-01.dump . --endpoint-url=https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com

# 還原（先建空 db）
pg_restore -d $DATABASE_URL_DIRECT 2026-05-01.dump
```

### 6.3 Webhook 重放

綠界 / LINE 重複 webhook 處理：
- 應用層 idempotency key（`ecpay_trade_no`、`line_webhook_event_id`）
- 重複事件直接 200 OK 不再處理

如果發現某個 webhook 沒處理到：
- 綠界後台可手動「重發」
- LINE 訊息無法重發，需依資料庫狀態手動修正

---

## 7. 監控與警報

- Sentry：錯誤即時推 LINE（依 §13.2 警報設定）
- Vercel Analytics：流量異常推 LINE
- Supabase：connection 異常 / 慢查詢警告
- CF Workers：Workers Dashboard 看 cron 執行紀錄

---

## 8. 上線檢核（每次 production 部署前）

- [ ] CI 全綠（lint / typecheck / test / drizzle-kit check）
- [ ] PR review 過
- [ ] 確認沒有 console.log 漏掉
- [ ] 環境變數確認（特別是新加的）
- [ ] Schema migration 套到 staging 且驗證
- [ ] 重大變更：先公告太太 + 朋友（LINE 群）
- [ ] 部署後 5 分鐘內確認首頁 / 結帳 / 訂單追蹤可正常瀏覽
- [ ] 部署後查看 Sentry，確認無新錯誤湧入
