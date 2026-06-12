'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireRole } from '@/server/services/AdminAuthService'
import { updateStoreSettings } from '@/server/services/StoreSettingsService'

export type SettingsState = { error?: string; success?: string }

const settingsSchema = z.object({
  botRate: z.coerce
    .number()
    .min(0.1, '匯率異常（低於 0.1）')
    .max(0.5, '匯率異常（高於 0.5）'),
  freeShipThresholdTwd: z.coerce
    .number()
    .int()
    .min(0, '門檻不可為負')
    .max(100000, '門檻異常（高於 10 萬）'),
})

export async function updateStoreSettingsAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const admin = await requireRole(['owner'])
  const parsed = settingsSchema.safeParse({
    botRate: formData.get('botRate'),
    freeShipThresholdTwd: formData.get('freeShipThresholdTwd'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '輸入格式錯誤' }
  }
  await updateStoreSettings(parsed.data, {
    id: admin.id,
    name: admin.name,
    email: admin.email,
  })
  revalidatePath('/admin/settings')
  revalidatePath('/checkout')
  revalidatePath('/cart')
  revalidatePath('/calculator')
  return { success: '設定已儲存' }
}

export type AiNotesState = { error?: string; success?: string }

const aiNotesSchema = z.object({
  aiNotes: z.string().max(6000, '備忘太長（上限 6000 字）'),
})

export async function updateAiNotesAction(
  _prev: AiNotesState,
  formData: FormData
): Promise<AiNotesState> {
  const admin = await requireRole(['owner', 'manager'])
  const parsed = aiNotesSchema.safeParse({
    aiNotes: formData.get('aiNotes') ?? '',
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '輸入格式錯誤' }
  }
  const { updateAiNotes } = await import('@/server/services/StoreSettingsService')
  await updateAiNotes(parsed.data.aiNotes, {
    id: admin.id,
    name: admin.name,
    email: admin.email,
  })
  revalidatePath('/admin/settings/ai')
  return { success: 'AI 備忘已儲存，下一次對話即生效' }
}
