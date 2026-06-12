import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/db/client'
import { orders, customers, orderStatusEnum } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { getCurrentAdmin } from '@/server/services/AdminAuthService'
import { changeStatus } from '@/server/services/OrderService'
import { getCouponById, grantCouponToCustomers, describeCoupon } from '@/server/services/CouponService'
import { recordAudit } from '@/server/services/AuditService'
import { canTransition, InvalidStatusTransitionError } from '@/lib/order-state-machine'
import { STATUS_LABEL } from '@/lib/order-progress'

/**
 * 執行 AI 小幫手的提案（使用者在確認卡片按「執行」後呼叫）。
 * 提案內容視為不可信輸入：權限、訂單歸屬、狀態機、券有效性全部在此重新驗證。
 */

const proposalSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('order_status'),
    orderId: z.string().uuid(),
    orderNumber: z.string().min(1).max(60),
    toStatus: z.enum(orderStatusEnum),
  }),
  z.object({
    kind: z.literal('coupon_grant'),
    couponId: z.string().uuid(),
    couponCode: z.string().min(1).max(40),
    customers: z
      .array(z.object({ id: z.string().uuid() }))
      .min(1)
      .max(10),
  }),
])

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const parsed = proposalSchema.safeParse(
    (await request.json().catch(() => null))?.proposal
  )
  if (!parsed.success) {
    return NextResponse.json({ error: '提案格式錯誤' }, { status: 400 })
  }
  const proposal = parsed.data

  try {
    if (proposal.kind === 'order_status') {
      // 與 changeOrderStatusAction 同權限（任何在職管理員）；狀態機在 changeStatus 內再驗一次
      const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, proposal.orderId), eq(orders.orgId, DEFAULT_ORG_ID)),
      })
      if (!order || order.orderNumber !== proposal.orderNumber) {
        return NextResponse.json({ error: '訂單不存在或編號不符，請重新提案' }, { status: 409 })
      }
      if (!canTransition(order.status, proposal.toStatus)) {
        return NextResponse.json(
          {
            error: `訂單目前是「${STATUS_LABEL[order.status]}」，已不能轉成「${STATUS_LABEL[proposal.toStatus]}」（可能狀態已被其他人更新），請重新提案`,
          },
          { status: 409 }
        )
      }
      const result = await changeStatus(
        proposal.orderId,
        proposal.toStatus,
        admin,
        'AI 小幫手提案，後台確認執行'
      )
      await recordAudit({
        actorType: 'admin',
        actorId: admin.id,
        actorLabel: admin.name,
        action: 'order.status.change',
        entityType: 'order',
        entityId: proposal.orderId,
        data: { from: result.from, to: result.to, via: 'ai-assistant' },
      })
      return NextResponse.json({
        message: `✓ ${proposal.orderNumber} 已變更為「${STATUS_LABEL[proposal.toStatus]}」，系統會自動通知客人`,
      })
    }

    // coupon_grant — 與 grantCouponAction 同權限
    if (!['owner', 'manager', 'editor'].includes(admin.role)) {
      return NextResponse.json({ error: '你的角色沒有發券權限（需店主/經理/編輯）' }, { status: 403 })
    }
    const coupon = await getCouponById(proposal.couponId)
    if (!coupon || !coupon.isActive || coupon.code !== proposal.couponCode) {
      return NextResponse.json({ error: '優惠券不存在或已停用，請重新提案' }, { status: 409 })
    }
    const ids = proposal.customers.map((c) => c.id)
    const verified = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.orgId, DEFAULT_ORG_ID), inArray(customers.id, ids)))
    if (verified.length === 0) {
      return NextResponse.json({ error: '找不到提案中的客戶，請重新提案' }, { status: 409 })
    }
    const result = await grantCouponToCustomers(coupon.id, verified.map((v) => v.id))
    await recordAudit({
      actorType: 'admin',
      actorId: admin.id,
      actorLabel: admin.name,
      action: 'coupon.grant',
      entityType: 'coupon',
      entityId: coupon.id,
      data: {
        code: coupon.code,
        granted: result.granted,
        alreadyHad: result.alreadyHad,
        via: 'ai-assistant',
      },
    })
    return NextResponse.json({
      message: `✓ 「${coupon.code}」（${describeCoupon(coupon)}）已發給 ${result.granted} 位客戶${
        result.alreadyHad > 0 ? `（${result.alreadyHad} 位先前已領過，自動略過）` : ''
      }，系統會通知客人`,
    })
  } catch (e) {
    if (e instanceof InvalidStatusTransitionError) {
      return NextResponse.json({ error: '狀態轉移不合法，訂單可能剛被其他人更新' }, { status: 409 })
    }
    console.error('[ai-execute] failed:', e)
    return NextResponse.json({ error: '執行失敗，請稍後再試' }, { status: 502 })
  }
}
