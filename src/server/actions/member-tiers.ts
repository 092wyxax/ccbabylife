'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireRole } from '@/server/services/AdminAuthService'
import {
  createTier,
  updateTier,
  deleteTier,
  type TierInput,
} from '@/server/services/MemberTierService'

export type TierState = { error?: string }

const tierSchema = z.object({
  name: z.string().min(1, '請填等級名稱').max(40),
  nameJp: z.string().max(40).optional(),
  color: z.string().max(20).optional(),
  thresholdTwd: z.coerce.number().int().nonnegative(),
  discountBp: z.coerce.number().int().min(0).max(10000),
  freeShipMinTwd: z.coerce.number().int().nonnegative().optional().nullable(),
  birthdayBonusTwd: z.coerce.number().int().nonnegative().default(0),
  perks: z.string().max(2000).optional(),
  sortOrder: z.coerce.number().int().default(0),
})

function parseForm(formData: FormData) {
  return tierSchema.safeParse({
    name: formData.get('name'),
    nameJp: (formData.get('nameJp') as string) || undefined,
    color: (formData.get('color') as string) || undefined,
    thresholdTwd: formData.get('thresholdTwd') || 0,
    discountBp: formData.get('discountBp') || 0,
    freeShipMinTwd: formData.get('freeShipMinTwd') || null,
    birthdayBonusTwd: formData.get('birthdayBonusTwd') || 0,
    perks: (formData.get('perks') as string) || undefined,
    sortOrder: formData.get('sortOrder') || 0,
  })
}

function toInput(d: z.infer<typeof tierSchema>): TierInput {
  return {
    name: d.name,
    nameJp: d.nameJp?.trim() || null,
    color: d.color?.trim() || null,
    thresholdTwd: d.thresholdTwd,
    discountBp: d.discountBp,
    freeShipMinTwd: d.freeShipMinTwd ?? null,
    birthdayBonusTwd: d.birthdayBonusTwd,
    perks: d.perks?.trim() || null,
    sortOrder: d.sortOrder ?? 0,
  }
}

export async function createTierAction(
  _prev: TierState,
  formData: FormData
): Promise<TierState> {
  await requireRole(['owner', 'manager'])
  const parsed = parseForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  }
  await createTier(toInput(parsed.data))
  revalidatePath('/admin/member-tiers')
  redirect('/admin/member-tiers')
}

export async function updateTierAction(
  id: string,
  _prev: TierState,
  formData: FormData
): Promise<TierState> {
  await requireRole(['owner', 'manager'])
  const parsed = parseForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  }
  await updateTier(id, toInput(parsed.data))
  revalidatePath('/admin/member-tiers')
  redirect('/admin/member-tiers')
}

export async function deleteTierAction(id: string) {
  await requireRole(['owner', 'manager'])
  await deleteTier(id)
  revalidatePath('/admin/member-tiers')
  redirect('/admin/member-tiers')
}
