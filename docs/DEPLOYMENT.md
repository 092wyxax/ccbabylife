# 部署 SOP — Zeabur

本專案部署在 **Zeabur**（app 本體，Docker standalone）+ **Supabase**（Postgres / Storage）。
原本在 Vercel，已於遷移時改為 Zeabur。

## 架構

| 元件 | 平台 | 備註 |
|---|---|---|
| Next.js 16 app | Zeabur（Dockerfile, standalone output） | 見根目錄 [`Dockerfile`](../Dockerfile) |
| Postgres + Storage | Supabase（`zlykoibooqlidkrqnvdj`） | transaction pooler `:6543`、direct `:5432` |
| 3 個排程 | Zeabur Cron 服務 | 見下方 [Cron](#cron) |
| 錯誤監控 | Sentry | build 時上傳 source map |

## Build：Dockerfile（standalone）

`next.config.ts` 設 `output: 'standalone'`，Dockerfile 多階段 build 出最小 runtime image。

### ⚠️ Build-time 變數（關鍵）

`NEXT_PUBLIC_*` 會在 **build 階段被內嵌進前端 bundle**，所以必須在 build 時就存在（不是只有 runtime）。
Dockerfile 以 `ARG` 宣告，Zeabur 會把同名 service 變數帶入 build。**這些沒設或設錯，前端會拿到空值且不會報錯。**

build 時必須提供：

- `NEXT_PUBLIC_SITE_URL`、`NEXT_PUBLIC_SITE_NAME`
- `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`、`NEXT_PUBLIC_APP_ENV`
- `NEXT_PUBLIC_LINE_OA_ID`、`NEXT_PUBLIC_TURNSTILE_SITE_KEY`、`NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `DATABASE_URL` —— build 的 prerender 階段有頁面會實際查 DB（如後台 intelligence 頁），所以 build 環境要能連到 Supabase。
- `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT`（選用，要上傳 source map 才需要）

> 在 Zeabur 把這些設成 service 變數即可；Zeabur 對 Dockerfile build 會自動把同名變數當 build arg 傳入。

### 本機驗證 build

```bash
docker build \
  --build-arg NEXT_PUBLIC_SITE_URL=https://ccbabylife.com \
  --build-arg NEXT_PUBLIC_SITE_NAME=日系選物店 \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://zlykoibooqlidkrqnvdj.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key> \
  --build-arg NEXT_PUBLIC_APP_ENV=production \
  --build-arg DATABASE_URL=<real-supabase-url> \
  -t ccbabylife:test .

docker run --rm -p 3000:3000 --env-file .env.local ccbabylife:test
```

## Runtime 環境變數

完整清單見 [`.env.example`](../.env.example)。在 Zeabur service 設定全部變數（runtime）：

- **Supabase**：`DATABASE_URL`、`DATABASE_URL_DIRECT`、`SUPABASE_SERVICE_ROLE_KEY` + 上面的 public 三件
- **LINE**：`LINE_JWT_SECRET`、`LINE_LOGIN_*`、`LINE_MESSAGING_*`、`LINE_OFFICIAL_ID`
- **金流（綠界）**：`ECPAY_ENV`、`ECPAY_MERCHANT_ID`、`ECPAY_HASH_KEY`、`ECPAY_HASH_IV`、`ECPAY_RETURN_URL`、`ECPAY_NOTIFY_URL`（改成正式網域，**不要再用 localhost**）
- **AI**：`ANTHROPIC_API_KEY`、`OPENAI_API_KEY`
- **Email**：`RESEND_API_KEY`、`EMAIL_FROM`
- **Turnstile**：`TURNSTILE_SECRET_KEY` + public site key
- **Sentry**：`SENTRY_DSN`、`APP_ENV`（取代舊的 `VERCEL_ENV`）
- **發票/公司**：`COMPANY_NAME`、`COMPANY_TAX_ID`
- **Cloudflare（如有用）**：`CF_*`
- **🔒 `CRON_SECRET`** —— **務必設定**。cron endpoint 用它驗證；沒設的話 `/api/cron/*` 任何人都打得到。

> 註：Sentry 的 environment 來源已從 `VERCEL_ENV` / `NEXT_PUBLIC_VERCEL_ENV` 改為 `APP_ENV` / `NEXT_PUBLIC_APP_ENV`（仍向後相容舊變數）。

## Cron

原 `vercel.json` 的排程在 Zeabur 不生效，改用 **Zeabur Cron 服務**，定時 curl endpoint 並帶上 `CRON_SECRET`。
三個排程（UTC）：

| 用途 | 路徑 | 排程 (UTC) |
|---|---|---|
| 寶寶月齡推播 | `/api/cron/baby-age-push` | `0 1 * * *`（每日 01:00）|
| 派發推播 | `/api/cron/dispatch-pushes` | `0 13 * * *`（每日 13:00）|
| 爬熱門商品 | `/api/cron/scrape-trending` | `0 20 * * 3`（每週三 20:00）|

每個 cron 服務跑：

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  https://ccbabylife.com/api/cron/baby-age-push
```

> `birthday-coupons` 路由存在但原本就沒排程；如需啟用再加一條。

## 網域

1. Zeabur service 綁定 `ccbabylife.com`。
2. DNS 從原本指向 Vercel 改指向 Zeabur 給的 CNAME / IP。
3. 確認 `NEXT_PUBLIC_SITE_URL`、綠界 `ECPAY_RETURN_URL` / `ECPAY_NOTIFY_URL`、LINE callback、Sentry allowed domains 都用正式網域。

## 遷移檢查清單

- [ ] Zeabur service 建好，指向此 repo，使用 Dockerfile
- [ ] build-time 變數（`NEXT_PUBLIC_*` + `DATABASE_URL`）已設
- [ ] runtime 變數全數設好，特別是 `CRON_SECRET`
- [ ] 3 個 Cron 服務建好並驗過（手動 curl 一次）
- [ ] 綠界 / LINE callback URL 改正式網域
- [ ] DNS 切到 Zeabur，確認 HTTPS 正常
- [ ] 移除 Vercel project（確定 Zeabur 穩定後）
