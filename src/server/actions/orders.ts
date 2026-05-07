'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db/client'
import { orders, customers } from '@/db/schema'
import { requireAdmin } from '@/server/services/AdminAuthService'
import { changeStatus } from '@/server/services/OrderService'
import { recordAudit } from '@/server/services/AuditService'
import { queueAndSendLine } from '@/server/services/NotificationService'
import { orderStatusEnum } from '@/db/schema'
import { InvalidStatusTransitionError } from '@/lib/order-state-machine'
import { LINE_TEMPLATES, renderTemplate } from '@/lib/line-templates'
import { isLineConfigured } from '@/lib/line-messaging'

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

export type ResendPaymentLinkState = { error?: string; success?: string }

export async function resendPaymentLinkFormAction(
  _prev: ResendPaymentLinkState,
  formData: FormData
): Promise<ResendPaymentLinkState> {
  const admin = await requireAdmin()

  const orderId = formData.get('orderId')
  if (typeof orderId !== 'string' || !orderId) {
    return { error: '訂單 ID 缺失' }
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)

  if (!order) return { error: '訂單不存在' }
  if (order.status !== 'pending_payment') {
    return { error: `訂單狀態為「${order.status}」，不需重發付款連結` }
  }
  if (!order.customerId) {
    return { error: '訂單未綁定會員，無法 LINE 推播' }
  }

  const [customer] = await db
    .select({
      lineUserId: customers.lineUserId,
      prefs: customers.notificationPrefs,
    })
    .from(customers)
    .where(eq(customers.id, order.customerId))
    .limit(1)

  if (!customer?.lineUserId) {
    return { error: '客戶尚未綁定 LINE（lineUserId 為空）' }
  }
  if (!customer.prefs?.line) {
    return { error: '客戶已關閉 LINE 通知偏好' }
  }
  if (!isLineConfigured()) {
    return { error: 'LINE Messaging API 尚未設定（.env.local 缺 LINE_MESSAGING_ACCESS_TOKEN）' }
  }

  const tmpl = LINE_TEMPLATES.find((t) => t.id === 'L8-payment-link')
  if (!tmpl) return { error: 'L8 模板未找到' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const body = renderTemplate(tmpl.body, {
    order_number: order.orderNumber,
    order_total: `NT$${order.total.toLocaleString('en-US')}`,
    payment_url: `${siteUrl}/pay/${order.id}`,
  })

  const { sent } = await queueAndSendLine({
    customerId: order.customerId,
    templateId: tmpl.id,
    body,
    payload: { orderId: order.id, source: 'admin-resend' },
  })

  await recordAudit({
    actorType: 'admin',
    actorId: admin.id,
    actorLabel: admin.name,
    action: 'order.payment_link.resend',
    entityType: 'order',
    entityId: orderId,
    data: { sent, orderNumber: order.orderNumber },
  })

  revalidatePath(`/admin/orders/${orderId}`)
  return {
    success: sent
      ? '付款連結已透過 LINE 送出'
      : '已加入推播佇列（將由 dispatch-pushes cron 重試）',
  }
}

const cancelSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(2).max(500),
})

export type CancelOrderState = { error?: string; success?: string }

export async function cancelOrderFormAction(
  _prev: CancelOrderState,
  formData: FormData
): Promise<CancelOrderState> {
  const admin = await requireAdmin()

  const parsed = cancelSchema.safeParse({
    orderId: formData.get('orderId'),
    reason: formData.get('reason'),
  })
  if (!parsed.success) {
    return { error: '請填寫取消原因（至少 2 字）' }
  }

  try {
    const result = await changeStatus(
      parsed.data.orderId,
      'cancelled',
      admin,
      parsed.data.reason
    )
    await recordAudit({
      actorType: 'admin',
      actorId: admin.id,
      actorLabel: admin.name,
      action: 'order.cancel',
      entityType: 'order',
      entityId: parsed.data.orderId,
      data: { from: result.from, reason: parsed.data.reason },
    })
    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${parsed.data.orderId}`)
    revalidatePath(`/track/${parsed.data.orderId}`)
    return { success: `訂單已取消（從「${result.from}」轉入）` }
  } catch (e) {
    if (e instanceof InvalidStatusTransitionError) {
      return { error: `當前狀態無法取消（${e.from}）` }
    }
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

const refundSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(2).max(500),
  refundAmount: z.coerce.number().int().nonnegative(),
})

export type RefundOrderState = { error?: string; success?: string }

export async function refundOrderFormAction(
  _prev: RefundOrderState,
  formData: FormData
): Promise<RefundOrderState> {
  const admin = await requireAdmin()

  const parsed = refundSchema.safeParse({
    orderId: formData.get('orderId'),
    reason: formData.get('reason'),
    refundAmount: formData.get('refundAmount'),
  })
  if (!parsed.success) {
    return { error: '請填寫退款金額與原因' }
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, parsed.data.orderId))
    .limit(1)
  if (!order) return { error: '訂單不存在' }
  if (parsed.data.refundAmount > order.total) {
    return { error: `退款金額不可超過訂單總額 NT$${order.total}` }
  }

  try {
    const result = await changeStatus(
      parsed.data.orderId,
      'refunded',
      admin,
      `退款 NT$${parsed.data.refundAmount} · ${parsed.data.reason}`
    )
    await recordAudit({
      actorType: 'admin',
      actorId: admin.id,
      actorLabel: admin.name,
      action: 'order.refund',
      entityType: 'order',
      entityId: parsed.data.orderId,
      data: {
        from: result.from,
        refundAmount: parsed.data.refundAmount,
        orderTotal: order.total,
        reason: parsed.data.reason,
      },
    })
    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${parsed.data.orderId}`)
    revalidatePath(`/track/${parsed.data.orderId}`)
    return {
      success: `已標記退款 NT$${parsed.data.refundAmount}（綠界端退款請在綠界後台另操作）`,
    }
  } catch (e) {
    if (e instanceof InvalidStatusTransitionError) {
      return { error: `當前狀態無法退款（${e.from}）` }
    }
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

// ============= Tracking number + internal notes =============

export type UpdateTrackingState = { error?: string; success?: string }

const trackingSchema = z.object({
  orderId: z.string().uuid(),
  trackingNumber: z.string().max(80).optional(),
  shippingProvider: z.string().max(40).optional(),
})

export async function updateTrackingAction(
  _prev: UpdateTrackingState,
  formData: FormData
): Promise<UpdateTrackingState> {
  const admin = await requireAdmin()
  const parsed = trackingSchema.safeParse({
    orderId: formData.get('orderId'),
    trackingNumber: formData.get('trackingNumber') || undefined,
    shippingProvider: formData.get('shippingProvider') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }

  await db
    .update(orders)
    .set({
      trackingNumber: parsed.data.trackingNumber?.trim() || null,
      shippingProvider: parsed.data.shippingProvider?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, parsed.data.orderId))

  await recordAudit({
    actorType: 'admin',
    actorId: admin.id,
    actorLabel: admin.name,
    action: 'order.tracking.update',
    entityType: 'order',
    entityId: parsed.data.orderId,
    data: {
      trackingNumber: parsed.data.trackingNumber,
      shippingProvider: parsed.data.shippingProvider,
    },
  })

  revalidatePath(`/admin/orders/${parsed.data.orderId}`)
  return { success: '物流資訊已更新' }
}

export type UpdateNotesState = { error?: string; success?: string }

const notesSchema = z.object({
  orderId: z.string().uuid(),
  notes: z.string().max(2000).optional(),
})

export async function updateOrderNotesAction(
  _prev: UpdateNotesState,
  formData: FormData
): Promise<UpdateNotesState> {
  const admin = await requireAdmin()
  const parsed = notesSchema.safeParse({
    orderId: formData.get('orderId'),
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }

  await db
    .update(orders)
    .set({
      notes: parsed.data.notes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, parsed.data.orderId))

  await recordAudit({
    actorType: 'admin',
    actorId: admin.id,
    actorLabel: admin.name,
    action: 'order.notes.update',
    entityType: 'order',
    entityId: parsed.data.orderId,
    data: {},
  })

  revalidatePath(`/admin/orders/${parsed.data.orderId}`)
  return { success: '已儲存' }
}
