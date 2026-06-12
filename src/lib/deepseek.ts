import 'server-only'
import { createOpenAI } from '@ai-sdk/openai'

/**
 * DeepSeek（OpenAI 相容 API）。後台 AI 助理一律走 DeepSeek；
 * 既有的 AI 商品建檔（AIAssistService）仍走 Anthropic，互不影響。
 * 必須用 .chat()——DeepSeek 只支援 chat completions，不支援 OpenAI responses API。
 */
const deepseekProvider = createOpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
})

export function isDeepSeekConfigured(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY)
}

export function deepseekChat() {
  return deepseekProvider.chat('deepseek-chat')
}
