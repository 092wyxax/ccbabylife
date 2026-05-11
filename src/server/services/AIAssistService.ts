import 'server-only'
import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'

const productExtractionSchema = z.object({
  nameJp: z.string().describe('日文商品名稱（保留漢字 + 假名）'),
  nameZh: z.string().describe('中文商品名稱（自然翻譯，可保留品牌英文）'),
  priceJpy: z.number().int().describe('日幣定價（含稅）'),
  weightG: z.number().int().nullable().describe('重量（公克），若頁面沒提供則 null'),
  brand: z.string().nullable().describe('品牌名稱，例如 Pigeon、Combi、Richell'),
  description: z.string().describe('商品說明（200 字內，繁體中文，誠實不誇大）'),
  imageUrl: z.string().url().nullable().describe('主商品圖 URL'),
  sourcePlatform: z
    .enum(['rakuten', 'amazon_jp', 'zozo', 'other'])
    .describe('來源平台識別'),
})

export type ProductExtraction = z.infer<typeof productExtractionSchema>

export class AIKeyMissingError extends Error {
  constructor() {
    super('ANTHROPIC_API_KEY 未設定，請在 .env.local 填入後重啟 dev server')
    this.name = 'AIKeyMissingError'
  }
}

export async function extractProductFromUrl(url: string): Promise<ProductExtraction> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AIKeyMissingError()
  }

  let html: string
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,en;q=0.9',
      },
      signal: AbortSignal.timeout(20_000),
    })
    if (!response.ok) {
      throw new Error(`日方網站回傳 ${response.status}，可能是反爬或網址錯誤`)
    }
    html = await response.text()
  } catch (e) {
    if (e instanceof Error) throw e
    throw new Error(String(e))
  }

  // Trim very large pages — Claude context handles plenty but cost matters.
  const truncated = html.slice(0, 80_000)

  const { object } = await generateObject({
    model: anthropic('claude-haiku-4-5-20251001'),
    schema: productExtractionSchema,
    maxRetries: 1,
    prompt: `這是一個日本電商網站的商品頁 HTML，請萃取商品資訊填入結構化欄位。
原始網址：${url}

規則：
- nameJp 保留漢字假名混合，不要刪
- nameZh 自然翻譯，品牌名（Pigeon、Combi、リッチェル → 利其爾）保留或翻譯皆可
- priceJpy 找頁面主要定價（通常標「税込」或紅字大字），純數字、不含貨幣符號或千分位
- weightG 若有「重量」「サイズ」欄位提到，換算成公克；找不到設 null
- brand 從頁面 logo 或標題萃取
- description 200 字內，誠實描述功能與材質，不誇大療效
- imageUrl 找主商品圖，優先 og:image meta tag
- sourcePlatform 依網址判斷：rakuten.co.jp → rakuten；amazon.co.jp → amazon_jp；zozo.jp → zozo；其餘 → other

HTML：
${truncated}`,
  })

  return object
}

// ─── Phase 1: enrichment (copy / age / category / IG draft) ────────────────

const enrichmentSchema = z.object({
  title: z
    .string()
    .max(80)
    .describe('SEO 友善中文標題，60 字內。格式：品牌 + 商品 + 規格 / 月齡。例：MikiHouse First 6 層紗布包屁衣｜80cm｜6–12 個月'),
  sellingPoints: z
    .array(z.string().max(40))
    .min(3)
    .max(3)
    .describe('3 個賣點，每點 30 字內，✓ 開頭'),
  seoDescription: z
    .string()
    .max(180)
    .describe('SEO meta description，150 字內，誠實不誇大，含品牌 + 核心特性'),
  igDraft: z
    .string()
    .max(300)
    .describe('IG / Threads 短文案初稿，200 字內，娃媽真心話語氣，emoji ≤ 5 個，**標記「（待太太修潤）」結尾**'),
  minAgeMonths: z
    .number()
    .int()
    .min(0)
    .max(240)
    .nullable()
    .describe('適用月齡下限；新生兒設 0，無月齡限制（如寵物用品）設 null'),
  maxAgeMonths: z
    .number()
    .int()
    .min(0)
    .max(240)
    .nullable()
    .describe('適用月齡上限；無上限或不適用月齡設 null'),
  categoryId: z
    .string()
    .nullable()
    .describe('從給定的 categories 列表選最匹配的 id；若沒有合適的就 null'),
  notSuitableFor: z
    .array(z.string().max(60))
    .max(4)
    .describe('「不適合誰用」反向清單，0–4 項，每項 60 字內。看不出來就空陣列'),
  warnings: z
    .array(z.string().max(120))
    .max(3)
    .describe('AI 自己的不確定 / 提醒人工檢查事項。例：「月齡資訊頁面沒明示，AI 推測」'),
})

export type ProductEnrichment = z.infer<typeof enrichmentSchema>

export interface EnrichCategory {
  id: string
  name: string
  slug: string
  minAgeMonths: number | null
  maxAgeMonths: number | null
}

/**
 * Phase 1: take the already-extracted product info + the store's existing
 * category list, ask Claude to generate copywriting + infer age range +
 * pick the best matching category. Single call to keep cost down.
 *
 * Returns null if ANTHROPIC_API_KEY is missing (caller can show a hint
 * but doesn't need to crash — extraction can still proceed).
 */
export async function enrichExtraction(
  extraction: ProductExtraction,
  categories: EnrichCategory[]
): Promise<ProductEnrichment | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null

  const categoryList = categories
    .map(
      (c) =>
        `- id=${c.id} | ${c.name} (slug=${c.slug}${
          c.minAgeMonths != null || c.maxAgeMonths != null
            ? `, 月齡 ${c.minAgeMonths ?? '?'}–${c.maxAgeMonths ?? '∞'}`
            : ''
        })`
    )
    .join('\n')

  const { object } = await generateObject({
    model: anthropic('claude-haiku-4-5-20251001'),
    schema: enrichmentSchema,
    maxRetries: 1,
    prompt: `你是熙熙初日（日系母嬰選品店）的文案助手。風格：誠實、不業配、娃媽真心話。

任務：根據以下已抽取的商品資訊 + 店家既有的 categories，生成完整文案 + 推斷月齡 + 對到品類。

商品資訊：
- 中文品名：${extraction.nameZh}
- 日文品名：${extraction.nameJp}
- 品牌：${extraction.brand ?? '未識別'}
- 商品說明：${extraction.description}
- 日幣定價：¥${extraction.priceJpy}
- 重量：${extraction.weightG ?? '未知'} g
- 來源網址：${extraction.sourcePlatform}

店家既有 categories（請從這份列表選 1 個，若無合適則 categoryId=null）：
${categoryList || '（暫無分類，全部設 null）'}

寫作規則：
- title 要對 SEO 友善：含品牌 + 主商品 + 規格或月齡，例「MikiHouse First 6 層紗布包屁衣｜80cm｜6–12 個月」
- sellingPoints 不誇大療效。例「✓ 6 層紗布吸水透氣」「✓ 領口反折設計不勒寶寶」
- igDraft 模擬娃媽自己寫的口吻，**結尾加（待太太修潤）**
- 月齡推斷：若品名 / 描述明示則照填；含糊則保守抓寬範圍；寵物 / 無月齡 → null
- categoryId：嚴格從上方列表的 id 中選，否則 null
- notSuitableFor：依商品特性想 2–4 條反向勸退（例：寶寶 > 18 個月、預算 < NT$500、急用、過敏體質）。看不出來就空陣列
- warnings：對你不確定的點誠實標記（月齡靠推測 / 重量沒抓到等）`,
  })

  // Validate categoryId actually exists in the list — Claude sometimes
  // hallucinates UUIDs even when explicitly told to pick from a list.
  if (object.categoryId) {
    const valid = categories.some((c) => c.id === object.categoryId)
    if (!valid) object.categoryId = null
  }

  return object
}
