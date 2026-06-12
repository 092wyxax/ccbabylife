import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentAdmin } from '@/server/services/AdminAuthService'
import {
  runAdminAssistant,
  DeepSeekKeyMissingError,
} from '@/server/services/AdminAiService'

export const maxDuration = 60

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(30),
})

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: '訊息格式錯誤' }, { status: 400 })
  }

  try {
    const text = await runAdminAssistant(parsed.data.messages)
    return NextResponse.json({ text })
  } catch (e) {
    if (e instanceof DeepSeekKeyMissingError) {
      return NextResponse.json({ error: e.message }, { status: 503 })
    }
    console.error('[ai-chat] failed:', e)
    return NextResponse.json(
      { error: 'AI 回覆失敗，請稍後再試' },
      { status: 502 }
    )
  }
}
