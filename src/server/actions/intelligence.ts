'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/server/services/AdminAuthService'
import { createCompetitor } from '@/server/services/IntelligenceService'

export type IntelligenceActionState = { error?: string; success?: string }

const competitorSchema = z.object({
  name: z.string().min(1, '請填名稱'),
  ig: z.string().optional().or(z.literal('')),
  shopee: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  monitoredKeywords: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export async function createCompetitorAction(
  _prev: IntelligenceActionState,
  formData: FormData
): Promise<IntelligenceActionState> {
  await requireAdmin()
  const parsed = competitorSchema.safeParse({
    name: formData.get('name'),
    ig: formData.get('ig') ?? '',
    shopee: formData.get('shopee') ?? '',
    website: formData.get('website') ?? '',
    monitoredKeywords: formData.get('monitoredKeywords') ?? '',
    notes: formData.get('notes') ?? '',
  })
  if (!parsed.success) return { error: '輸入錯誤' }

  const keywords = (parsed.data.monitoredKeywords ?? '')
    .split(/[,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  await createCompetitor({
    name: parsed.data.name,
    platforms: {
      ig: parsed.data.ig || undefined,
      shopee: parsed.data.shopee || undefined,
      website: parsed.data.website || undefined,
    },
    monitoredKeywords: keywords.length > 0 ? keywords : null,
    notes: parsed.data.notes || null,
  })

  revalidatePath('/admin/intelligence/competitors')
  revalidatePath('/admin/intelligence')
  return { success: '已新增競品' }
}
