# 市場情報系統設計

> Phase 5 開始實作，作為內部選品工具與未來 SaaS 副業的基礎。
> 對應 ARCHITECTURE.md §4.3、§5.2 A9、§9 Phase 5。
> 目前文件以**設計藍圖**形式存在，動工時依本文件展開。

---

## 1. 目標

### 1.1 內部用途
- 替代「逛網路看大家在說什麼」的人工選品
- 早期發現流量翻倍的商品（搶在競爭對手前）
- 監控固定競爭對手的上下架、價格變動
- 每週一份 AI 整理的選品建議

### 1.2 未來 SaaS 用途
- 對其他日系代購／選物店收費（NT$2,000/月起）
- 提供「日本×台灣」雙邊趨勢交叉
- 多租戶切割已在 M1 預備（org_id）

---

## 2. 資料來源

### 2.1 抓取目標

| 來源 | 抓什麼 | 頻率 | 法規／反爬風險 |
|---|---|---|---|
| PTT BabyMother、Pet 板 | 文章 + 推文 | 每日 | 低（公開） |
| Dcard 親子、寵物板 | 文章 + 評論 | 每日 | 中（有 anti-bot） |
| 蝦皮關鍵字搜尋（日系母嬰、日本代購）| 商品 + 銷量 | 每日 | 中（API rate limit） |
| Google Trends（日系母嬰、Pigeon、Combi 等關鍵字）| 趨勢分數 | 每日 | 低 |
| 樂天 JP 商品頁 | 銷量、評論 | 每週 | 中 |
| Amazon JP（特定 ASIN 監控）| 排名、價格 | 每日 | 高（需 proxy） |
| IG / Threads 公開貼文（指定標籤）| 貼文、互動數 | 每日 | 中 |

### 2.2 法規檢核
- PTT、Dcard：robots.txt 允許 + 公開內容 → 安全
- 蝦皮：API 有 rate limit、但個人爬不違反 ToS → 慎用
- Amazon：明確禁止爬蟲 → 走第三方 SP-API 或代理
- IG / Threads：用 Meta Graph API（合法），不爬網頁

---

## 3. 系統架構

### 3.1 部署位置（M4 修正後）

```
所有環節跑在 Cloudflare Workers：
- 排程：Workers Cron Triggers
- 抓取：fetch + parse
- AI 清理：fetch Anthropic API
- 寫回：Supabase REST API（service role）
```

### 3.2 資料表

```
raw_posts                 爬蟲原始 HTML / JSON
  - id, source, source_url, raw_content (text), fetched_at, org_id

cleaned_data              Claude 清理後結構化
  - id, raw_post_id, source, title, content, mentioned_products (text[]),
    sentiment (enum), tags (text[]), embedding (vector(1536)), org_id

trends                    趨勢聚合（每日 / 每週 ）
  - id, period (daily/weekly), period_start, keyword, source,
    mention_count, sentiment_avg, change_pct, related_products (uuid[]), org_id

competitors               追蹤的對手
  - id, name, platforms (jsonb), monitored_keywords (text[]), org_id

competitor_snapshots      對手快照
  - id, competitor_id, captured_at, products (jsonb), org_id

intelligence_reports      AI 週報
  - id, period_start, summary (text), recommendations (jsonb),
    generated_at, org_id
```

### 3.3 資料流

```
[週一 00:00 UTC = 台灣 08:00]
  ↓
CF Worker Cron Trigger
  ↓
1. PTT/Dcard/蝦皮/Trends 各跑一個 sub-worker
2. 每個 sub-worker 寫入 raw_posts
3. 完成後觸發 Claude pipeline
  ↓
Claude API（清理 / 分類 / 抓商品名）
  ↓
寫入 cleaned_data
  ↓
OpenAI Embedding API（vector）
  ↓
更新 cleaned_data.embedding
  ↓
聚合 → trends 表
  ↓
Claude API（依 trends + 自店商品 → 產出週報）
  ↓
寫入 intelligence_reports
  ↓
LINE 推播給先生（使用 LINE Push）
  ↓
後台 /admin/intelligence 可視化
```

---

## 4. 分析模組

### 4.1 趨勢偵測

- 比對本週 vs 上週的關鍵字提及量
- 變動 > 50% 標記為「異常上升」（候選商品）
- 加 sentiment（Claude 判斷）：負評多就警示

### 4.2 競品監控

朋友先列出 5–10 個固定追蹤對手（如「XX日代」、「XX日本選物」）：
- 監控對手 IG / 蝦皮關鍵字
- 每週快照：上了哪些新品？哪些下架？哪些降價？
- 新品 + 我們沒上 → 「考慮跟進」標記

### 4.3 自店匹配

把抓到的「熱門商品」對應自店現有商品：
- 已有 → 標「應加大宣傳」
- 沒有 + 綠燈品類 → 標「進貨建議」
- 沒有 + 紅燈 → 忽略

---

## 5. 後台 UI

```
/admin/intelligence
├ 即時儀表板：本週 top 10 上升關鍵字、top 5 競品變動
├ /trends：時間序列圖、依 source 過濾
├ /competitors：對手清單、最新快照、變動 diff
├ /reports：歷史 AI 週報
├ /recommendations：進貨建議列表（一鍵建立採購單）
└ /settings：管理追蹤關鍵字、競品、訂閱（誰收 LINE 推播）
```

---

## 6. AI 週報範例

```
[2026/06/01 — 本週情報摘要]

🔥 上升中
1. 「Pigeon 母乳實感奶瓶 240ml」+78% 提及
   來源：PTT BabyMother（2 篇推爆）、Dcard 親子（1 篇）
   情感：正向 92%
   ⚠ 我們有 → 建議加大宣傳，可在 IG 出心得文

2. 「Combi 餐椅可升降款」+62% 提及
   來源：Dcard、IG 媽媽社團
   ⚠ 我們沒有 → 評估進貨

📉 下降中
1. 「西松屋特定款連身衣」-34%
   情感：負向比例上升（破洞、染色問題）
   ⚠ 我們有 → 建議減少進貨

🏃 競品動態
- 對手 A：本週上 12 件新品，5 件母嬰、7 件寵物
- 對手 B：「Pigeon 奶瓶」降價 8%（從 NT$890 → NT$820）
  ⚠ 我們現在賣 NT$880，建議考慮微調或加贈品

📋 進貨建議
1. Combi 餐椅 — 預估月銷 5–8 件
2. ...
```

---

## 7. 成本

依日配額估：
- CF Workers：免費（< 10 萬 req/天）
- Anthropic：~NT$1,500/月（4o tokens × 100 篇/日 × 30 天）
- OpenAI Embedding：~NT$500/月（small 模型）
- Supabase：vector 欄位免費版可用

---

## 8. 待補

- [ ] Phase 5 實作前，先列 5–10 個固定追蹤對手與關鍵字
- [ ] PTT 爬蟲怕被擋，先用 cookie + 隨機 UA 試
- [ ] Embedding 用哪個模型（text-embedding-3-small vs large）
- [ ] 客戶端（SaaS 化時）多租戶隔離測試
