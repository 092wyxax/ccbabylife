import 'server-only'

/**
 * Anthropic Claude integration: translate JP product name → ZH,
 * categorize, and flag items that fall under Taiwan import-restricted classes.
 *
 * Requires ANTHROPIC_API_KEY env var.
 */

export interface ClassificationInput {
  itemName: string
  shopName: string
  priceJpy: number
  itemUrl: string
}

export interface Classification {
  nameZh: string
  category: string
  /** True = cannot legally sell under TW law (奶粉/處方藥/含肉寵物食品 etc) */
  restricted: boolean
  /** When restricted=true, brief reason citing the relevant rule. */
  restrictedReason: string | null
}

const SYSTEM_PROMPT = `You are a careful Taiwan-to-Japan e-commerce classifier for a baby/pet products import store.

Your job: take a Japanese product listing and return JSON with:
1. nameZh — concise Traditional Chinese product name (繁中, 30 chars or less, keep brand romaji as-is)
2. category — one of: 哺乳用品, 餐具, 副食品工具, 配方奶粉, 紙尿布, 嬰兒服飾, 嬰兒寢具, 嬰兒清潔, 嬰兒玩具, 寵物食品, 寵物零食, 寵物用品, 寵物玩具, 其他
3. restricted — true if the product falls into ANY of these Taiwan import-restricted categories:
   - 嬰兒配方食品 / 較大嬰兒配方食品 / 任何 0–36 個月奶粉（食安法、嬰兒配方查驗登記辦法）
   - 處方藥 / 一般用藥 / 嬰兒退熱貼 / 體溫計（藥事法、醫療器材法）
   - 含肉類成分的寵物食品（動物傳染病防治條例）
   - 寵物處方食品 / 寵物用藥（動物用藥品管理法）
   - 含酒精製品 / 一般食品 / 健康食品
   - 武器、刀械、仿冒品
4. restrictedReason — when restricted=true, ONE concise sentence in 繁中 citing the relevant rule. When false, return null.

Return ONLY valid JSON. No prose, no markdown fences. Example:
{"nameZh":"Pigeon 母乳實感奶瓶 240ml","category":"哺乳用品","restricted":false,"restrictedReason":null}`

interface ClaudeResponse {
  content?: Array<{ type: string; text?: string }>
  error?: { type: string; message: string }
}

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

export async function classifyProduct(
  input: ClassificationInput
): Promise<Classification> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY not configured')

  const userPrompt = `Classify this Japanese product:
itemName: ${input.itemName}
shopName: ${input.shopName}
priceJpy: ${input.priceJpy}
itemUrl: ${input.itemUrl}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Anthropic API ${res.status}: ${body}`)
  }
  const json = (await res.json()) as ClaudeResponse
  if (json.error) {
    throw new Error(`Anthropic error ${json.error.type}: ${json.error.message}`)
  }

  const text = json.content?.find((c) => c.type === 'text')?.text?.trim()
  if (!text) throw new Error('Anthropic returned empty content')

  // Strip accidental markdown fences if any
  const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim()

  try {
    const parsed = JSON.parse(cleaned) as Classification
    if (typeof parsed.nameZh !== 'string' || typeof parsed.restricted !== 'boolean') {
      throw new Error('shape')
    }
    return {
      nameZh: parsed.nameZh,
      category: parsed.category ?? '其他',
      restricted: parsed.restricted,
      restrictedReason: parsed.restricted ? parsed.restrictedReason ?? '依台灣法規不販售' : null,
    }
  } catch {
    throw new Error(`Anthropic returned non-JSON: ${cleaned.slice(0, 200)}`)
  }
}
