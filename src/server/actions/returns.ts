'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getCustomerSession } from '@/lib/customer-session'
import { requireRole } from '@/server/services/AdminAuthService'
import {
  createReturnRequest,
  updateReturnStatus,
} from '@/server/services/ReturnService'
import { returnTypeEnum, returnStatusEnum } from '@/db/schema/return_requests'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export type ReturnFormState = {
  error?: string
  success?: string
  requestNumber?: string
}

const customerSchema = z.object({
  orderId: z.string().uuid(),
  type: z.enum(returnTypeEnum),
  reason: z.string().min(10, '請至少寫 10 字說明原因').max(1000),
  selectedOrderItemIds: z.array(z.string().uuid()).optional(),
})

export async function createReturnRequestAction(
  _prev: ReturnFormState,
  formData: FormData
): Promise<ReturnFormState> {
  const session = await getCustomerSession()
  if (!session) return { error: '請先登入' }

  const ip = await getClientIp()
  const limit = rateLimit(`return:${ip}`, 5, 60 * 60 * 1000)
  if (!limit.ok) return { error: '操作太頻繁，請稍後再試' }

  const parsed = customerSchema.safeParse({
    orderId: formData.get('orderId'),
    type: formData.get('type'),
    reason: formData.get('reason'),
    selectedOrderItemIds: formData.getAll('selectedOrderItemIds').map(String).filter(Boolean),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  }

  try {
    const req = await createReturnRequest({
      orderId: parsed.data.orderId,
      customerId: session.customerId,
      type: parsed.data.type,
      reason: parsed.data.reason,
      selectedOrderItemIds: parsed.data.selectedOrderItemIds,
    })
    revalidatePath(`/track/${parsed.data.orderId}`)
    revalidatePath('/account/returns')
    return {
      success: '已收到你的申請，客服會在 24 小時內聯繫',
      requestNumber: req.requestNumber,
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

const adminUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(returnStatusEnum),
  internalNotes: z.string().max(2000).optional(),
  refundTwd: z.coerce.number().int().nonnegative().optional(),
})

export async function adminUpdateReturnAction(formData: FormData): Promise<void> {
  const me = await requireRole(['owner', 'manager', 'ops'])
  const parsed = adminUpdateSchema.safeParse({
    id: formData.get('id'),
    status: formData.get('status'),
    internalNotes: (formData.get('internalNotes') as string) || undefined,
    refundTwd: formData.get('refundTwd') || undefined,
  })
  if (!parsed.success) return

  await updateReturnStatus(parsed.data.id, parsed.data.status, {
    handledById: me.id,
    internalNotes: parsed.data.internalNotes,
    refundTwd: parsed.data.refundTwd,
  })

  revalidatePath('/admin/returns')
  redirect('/admin/returns')
}
