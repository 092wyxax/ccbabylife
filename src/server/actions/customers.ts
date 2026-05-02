'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/server/services/AdminAuthService'
import { updateCustomer } from '@/server/services/CustomerService'
import { recordAudit } from '@/server/services/AuditService'

export type CustomerActionState = { error?: string; success?: string }

const profileSchema = z.object({
  name: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  babyBirthDate: z.string().optional().or(z.literal('')),
  babyGender: z.string().optional().or(z.literal('')),
})

export async function updateCustomerProfileAction(
  customerId: string,
  _prev: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  await requireAdmin()
  const parsed = profileSchema.safeParse({
    name: formData.get('name') ?? '',
    phone: formData.get('phone') ?? '',
    babyBirthDate: formData.get('babyBirthDate') ?? '',
    babyGender: formData.get('babyGender') ?? '',
  })
  if (!parsed.success) return { error: '輸入錯誤' }

  await updateCustomer(customerId, {
    name: parsed.data.name || null,
    phone: parsed.data.phone || null,
    babyBirthDate: parsed.data.babyBirthDate || null,
    babyGender: parsed.data.babyGender || null,
  })

  revalidatePath('/admin/customers')
  revalidatePath(`/admin/customers/${customerId}`)
  return { success: '基本資料已更新' }
}

const blacklistSchema = z.object({
  isBlacklisted: z.coerce.boolean(),
})

export async function setBlacklistAction(
  customerId: string,
  _prev: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  const admin = await requireAdmin()
  const isBlacklisted = formData.get('isBlacklisted') === 'true'
  blacklistSchema.parse({ isBlacklisted })

  await updateCustomer(customerId, { isBlacklisted })

  await recordAudit({
    actorType: 'admin',
    actorId: admin.id,
    actorLabel: admin.name,
    action: isBlacklisted ? 'customer.blacklist.add' : 'customer.blacklist.remove',
    entityType: 'customer',
    entityId: customerId,
    data: { isBlacklisted },
  })

  revalidatePath('/admin/customers')
  revalidatePath(`/admin/customers/${customerId}`)
  return {
    success: isBlacklisted ? '已加入黑名單' : '已取消黑名單',
  }
}

const creditSchema = z.object({
  delta: z.coerce.number().int(),
  reason: z.string().optional(),
  currentCredit: z.coerce.number().int().nonnegative(),
})

export async function adjustStoreCreditAction(
  customerId: string,
  _prev: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  const admin = await requireAdmin()
  const parsed = creditSchema.safeParse({
    delta: formData.get('delta'),
    reason: formData.get('reason') ?? '',
    currentCredit: formData.get('currentCredit'),
  })
  if (!parsed.success) return { error: '輸入錯誤' }
  if (parsed.data.delta === 0) return { error: '請填非零的調整量' }

  const next = Math.max(0, parsed.data.currentCredit + parsed.data.delta)
  await updateCustomer(customerId, { storeCredit: next })

  await recordAudit({
    actorType: 'admin',
    actorId: admin.id,
    actorLabel: admin.name,
    action: 'customer.store_credit.adjust',
    entityType: 'customer',
    entityId: customerId,
    data: {
      delta: parsed.data.delta,
      before: parsed.data.currentCredit,
      after: next,
      reason: parsed.data.reason || null,
    },
  })

  revalidatePath('/admin/customers')
  revalidatePath(`/admin/customers/${customerId}`)
  return {
    success: `購物金 ${parsed.data.currentCredit} → ${next}（${parsed.data.delta > 0 ? '+' : ''}${parsed.data.delta}）`,
  }
}

const tagsSchema = z.object({
  tags: z.string(),
})

export async function setTagsAction(
  customerId: string,
  _prev: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  await requireAdmin()
  const parsed = tagsSchema.safeParse({ tags: formData.get('tags') ?? '' })
  if (!parsed.success) return { error: '輸入錯誤' }

  const tags = parsed.data.tags
    .split(/[,，\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)

  await updateCustomer(customerId, { tags: tags.length > 0 ? tags : null })

  revalidatePath('/admin/customers')
  revalidatePath(`/admin/customers/${customerId}`)
  return { success: `標籤已更新（${tags.length} 個）` }
}
