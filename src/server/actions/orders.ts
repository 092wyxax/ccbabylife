'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/server/services/AdminAuthService'
import { changeStatus } from '@/server/services/OrderService'
import { recordAudit } from '@/server/services/AuditService'
import { orderStatusEnum } from '@/db/schema'
import { InvalidStatusTransitionError } from '@/lib/order-state-machine'

const schema = z.object({
  toStatus: z.enum(orderStatusEnum),
  reason: z.string().max(500).optional().or(z.literal('')),
})

export type ChangeStatusState = { error?: string; success?: string }

export async function changeOrderStatusAction(
  orderId: string,
  _prev: ChangeStatusState,
  formData: FormData
): Promise<ChangeStatusState> {
  const admin = await requireAdmin()

  const parsed = schema.safeParse({
    toStatus: formData.get('toStatus'),
    reason: formData.get('reason') ?? undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  }

  try {
    const result = await changeStatus(
      orderId,
      parsed.data.toStatus,
      admin,
      parsed.data.reason || undefined
    )
    await recordAudit({
      actorType: 'admin',
      actorId: admin.id,
      actorLabel: admin.name,
      action: 'order.status.change',
      entityType: 'order',
      entityId: orderId,
      data: {
        from: result.from,
        to: result.to,
        reason: parsed.data.reason || null,
      },
    })
    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${orderId}`)
    revalidatePath(`/track/${orderId}`)
    return { success: `已從「${result.from}」變更為「${result.to}」` }
  } catch (e) {
    if (e instanceof InvalidStatusTransitionError) {
      return { error: `非法轉移：${e.from} → ${e.to}（請依狀態機規範）` }
    }
    return { error: e instanceof Error ? e.message : String(e) }
  }
}
