'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { subscriptions } from '@/db/schema/subscriptions'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { getCustomerSession } from '@/lib/customer-session'
import {
  createSubscription,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  processDueSubscriptions,
} from '@/server/services/SubscriptionService'
import { requireRole } from '@/server/services/AdminAuthService'

export type SubscriptionState = { error?: string; success?: string }

const createSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(20),
  frequency: z.enum(['monthly', 'bimonthly', 'quarterly']),
})

export async function createSubscriptionAction(
  _prev: SubscriptionState,
  formData: FormData
): Promise<SubscriptionState> {
  const session = await getCustomerSession()
  if (!session) return { error: '請先登入' }

  const parsed = createSchema.safeParse({
    productId: formData.get('productId'),
    quantity: formData.get('quantity') || 1,
    frequency: formData.get('frequency') || 'monthly',
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }

  await createSubscription({
    customerId: session.customerId,
    frequency: parsed.data.frequency,
    lines: [{ productId: parsed.data.productId, quantity: parsed.data.quantity }],
  })

  revalidatePath('/account/subscriptions')
  return { success: '已建立訂閱，下次配送日已排定' }
}

export async function pauseSubscriptionAction(formData: FormData): Promise<void> {
  const session = await getCustomerSession()
  if (!session) return
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await pauseSubscription(id, session.customerId)
  revalidatePath('/account/subscriptions')
}

export async function resumeSubscriptionAction(formData: FormData): Promise<void> {
  const session = await getCustomerSession()
  if (!session) return
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await resumeSubscription(id, session.customerId)
  revalidatePath('/account/subscriptions')
}

export async function cancelSubscriptionAction(formData: FormData): Promise<void> {
  const session = await getCustomerSession()
  if (!session) return
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await cancelSubscription(id, session.customerId)
  revalidatePath('/account/subscriptions')
}

/**
 * Admin-only: force a subscription to run immediately by setting nextRunAt
 * to now and invoking the dispatcher. Useful for testing or when a customer
 * asks for an early run.
 */
export async function adminRunSubscriptionNowAction(
  formData: FormData
): Promise<void> {
  await requireRole(['owner', 'manager'])
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await db
    .update(subscriptions)
    .set({ nextRunAt: new Date(), updatedAt: new Date() })
    .where(
      and(eq(subscriptions.id, id), eq(subscriptions.orgId, DEFAULT_ORG_ID))
    )
  await processDueSubscriptions()
  revalidatePath('/admin/subscriptions')
}
