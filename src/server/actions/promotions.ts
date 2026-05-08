'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireRole } from '@/server/services/AdminAuthService'
import {
  createThresholdGift,
  updateThresholdGift,
  deleteThresholdGift,
  createAddon,
  deleteAddon,
  type ThresholdGiftInput,
} from '@/server/services/PromotionService'

export type PromoState = { error?: string }

// ─── threshold gifts ────

const giftSchema = z.object({
  name: z.string().min(1, '請填活動名稱').max(100),
  thresholdTwd: z.coerce.number().int().nonnegative(),
  giftProductId: z.string().uuid('請選擇贈品商品'),
  quantity: z.coerce.number().int().positive().default(1),
  isActive: z.coerce.boolean().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
})

function parseGift(formData: FormData) {
  return giftSchema.safeParse({
    name: formData.get('name'),
    thresholdTwd: formData.get('thresholdTwd') || 0,
    giftProductId: formData.get('giftProductId'),
    quantity: formData.get('quantity') || 1,
    isActive: formData.get('isActive') === 'on',
    startsAt: (formData.get('startsAt') as string) || undefined,
    expiresAt: (formData.get('expiresAt') as string) || undefined,
    sortOrder: formData.get('sortOrder') || 0,
  })
}

function toGiftInput(d: z.infer<typeof giftSchema>): ThresholdGiftInput {
  return {
    name: d.name,
    thresholdTwd: d.thresholdTwd,
    giftProductId: d.giftProductId,
    quantity: d.quantity,
    isActive: d.isActive ?? true,
    startsAt: d.startsAt ? new Date(d.startsAt) : null,
    expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
    sortOrder: d.sortOrder,
  }
}

export async function createGiftAction(
  _prev: PromoState,
  formData: FormData
): Promise<PromoState> {
  await requireRole(['owner', 'manager', 'editor'])
  const parsed = parseGift(formData)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  await createThresholdGift(toGiftInput(parsed.data))
  revalidatePath('/admin/promotions')
  redirect('/admin/promotions')
}

export async function updateGiftAction(
  id: string,
  _prev: PromoState,
  formData: FormData
): Promise<PromoState> {
  await requireRole(['owner', 'manager', 'editor'])
  const parsed = parseGift(formData)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  await updateThresholdGift(id, toGiftInput(parsed.data))
  revalidatePath('/admin/promotions')
  redirect('/admin/promotions')
}

export async function deleteGiftAction(id: string) {
  await requireRole(['owner', 'manager'])
  await deleteThresholdGift(id)
  revalidatePath('/admin/promotions')
  redirect('/admin/promotions')
}

// ─── product add-ons ────

const addonSchema = z.object({
  mainProductId: z.string().uuid(),
  addonProductId: z.string().uuid(),
  addonPriceTwd: z.coerce.number().int().nonnegative(),
  maxAddonQty: z.coerce.number().int().positive().default(1),
  isActive: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().default(0),
})

export async function createAddonAction(
  _prev: PromoState,
  formData: FormData
): Promise<PromoState> {
  await requireRole(['owner', 'manager', 'editor'])
  const parsed = addonSchema.safeParse({
    mainProductId: formData.get('mainProductId'),
    addonProductId: formData.get('addonProductId'),
    addonPriceTwd: formData.get('addonPriceTwd') || 0,
    maxAddonQty: formData.get('maxAddonQty') || 1,
    isActive: formData.get('isActive') === 'on',
    sortOrder: formData.get('sortOrder') || 0,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  if (parsed.data.mainProductId === parsed.data.addonProductId) {
    return { error: '主商品與加購商品不能相同' }
  }
  await createAddon(parsed.data)
  revalidatePath('/admin/promotions')
  redirect('/admin/promotions')
}

export async function deleteAddonAction(id: string) {
  await requireRole(['owner', 'manager', 'editor'])
  await deleteAddon(id)
  revalidatePath('/admin/promotions')
  redirect('/admin/promotions')
}
