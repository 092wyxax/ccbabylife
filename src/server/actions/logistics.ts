'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { orders, customers } from '@/db/schema'
import { requireRole } from '@/server/services/AdminAuthService'
import {
  createCvsShipment,
  type CvsType,
} from '@/integrations/ecpay/logistics'

const CVS_MAP: Record<string, CvsType> = {
  cvs_711: 'UNIMARTC2C',
  cvs_family: 'FAMIC2C',
  cvs_hilife: 'HILIFEC2C',
  cvs_okmart: 'OKMARTC2C',
}

export type LogisticsActionState = { error?: string; success?: string }

export async function createLogisticsAction(
  orderId: string,
  _prev: LogisticsActionState,
  _formData: FormData
): Promise<LogisticsActionState> {
  await requireRole(['owner', 'manager', 'ops'])

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) return { error: '訂單不存在' }
  if (!order.shippingMethod || !order.shippingMethod.startsWith('cvs_')) {
    return { error: '此訂單非超商取貨，無法建立物流單' }
  }
  if (!order.cvsStoreId) {
    return { error: '訂單未指定取貨門市' }
  }
  if (order.ecpayLogisticsId) {
    return { error: '物流單已建立' }
  }
  if (order.status !== 'paid' && order.status !== 'received_jp' && order.status !== 'arrived_tw') {
    return { error: '訂單狀態尚未進入可出貨階段' }
  }

  const cvsType = CVS_MAP[order.shippingMethod]
  if (!cvsType) return { error: '不支援的物流類型' }

  const [customer] = await db.select().from(customers).where(eq(customers.id, order.customerId)).limit(1)
  const recipientName = order.shippingAddress?.recipientName ?? customer?.name ?? '客戶'
  const recipientPhone = order.shippingAddress?.phone ?? customer?.phone ?? ''

  const senderName = process.env.ECPAY_SENDER_NAME ?? '熙熙初日'
  const senderPhone = process.env.ECPAY_SENDER_PHONE ?? ''

  const result = await createCvsShipment({
    merchantTradeNo: order.orderNumber,
    goodsAmount: order.total,
    goodsName: `熙熙初日 ${order.orderNumber}`,
    senderName,
    senderPhone,
    receiverName: recipientName,
    receiverPhone: recipientPhone,
    receiverEmail: order.recipientEmail,
    cvsType,
    cvsStoreId: order.cvsStoreId,
  })

  if (!result.ok) {
    return { error: result.error || '建立物流單失敗' }
  }

  // Parse extra fields from raw response (CVSPaymentNo / CVSValidationNo on success)
  const raw = Object.fromEntries(new URLSearchParams(result.raw))
  await db
    .update(orders)
    .set({
      ecpayLogisticsId: result.logisticsId,
      cvsPaymentNo: raw.CVSPaymentNo ?? null,
      cvsValidationNo: raw.CVSValidationNo ?? null,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))

  revalidatePath(`/admin/orders/${orderId}`)
  return { success: `物流單已建立：${result.logisticsId}` }
}

export async function printLabelAction(orderId: string): Promise<void> {
  await requireRole(['owner', 'manager', 'ops'])
  redirect(`/admin/orders/${orderId}/label`)
}
