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
  sourcePlatform: z.enum(['rakuten', 'amazon_jp', 'zozo', 'other']).describe('來源平台識別'),
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
