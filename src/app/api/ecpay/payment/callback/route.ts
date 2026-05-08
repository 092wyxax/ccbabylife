import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { orders, orderStatusLogs, customers } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { ecpayCreds } from '@/integrations/ecpay/config'
import { verifyCheckMacValue } from '@/integrations/ecpay/checksum'
import { sql } from 'drizzle-orm'

/**
 * ECPay server-to-server payment callback.
 * ECPay POSTs URL-encoded form fields incl. CheckMacValue.
 * We must respond with the literal "1|OK" on success or ECPay retries.
 *
 * We:
 *   1. Verify CheckMacValue
 *   2. Look up order by MerchantTradeNo
 *   3. If RtnCode=1 → mark order paid, log status, +totalSpent, recalc tier
 *   4. Reply "1|OK"
 */
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const params: Record<string, string> = {}
  formData.forEach((v, k) => {
    if (typeof v === 'string') params[k] = v
  })

  const { hashKey, hashIv } = ecpayCreds()

  if (!verifyCheckMacValue(params, hashKey, hashIv)) {
    console.error('[ecpay/callback] CheckMacValue mismatch', params)
    return new NextResponse('0|CheckMacValue invalid', { status: 400 })
  }

  const merchantTradeNo = params.MerchantTradeNo
  const rtnCode = params.RtnCode
  const tradeNo = params.TradeNo

  if (!merchantTradeNo) {
    return new NextResponse('0|missing MerchantTradeNo', { status: 400 })
  }

  // Find the order by orderNumber (we used orderNumber as MerchantTradeNo)
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.orgId, DEFAULT_ORG_ID), eq(orders.orderNumber, merchantTradeNo)))
    .limit(1)
  if (!order) {
    console.error('[ecpay/callback] order not found:', merchantTradeNo)
    return new NextResponse('0|order not found', { status: 404 })
  }

  // RtnCode=1 means success; ECPay also sends async info pings (e.g. ATM number assigned)
  if (rtnCode === '1') {
    if (order.status === 'pending_payment') {
      try {
        await db.transaction(async (tx) => {
          await tx
            .update(orders)
            .set({
              status: 'paid',
              paymentStatus: 'paid',
              ecpayTradeNo: tradeNo ?? null,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id))

          await tx.insert(orderStatusLogs).values({
            orgId: order.orgId,
            orderId: order.id,
            fromStatus: order.status,
            toStatus: 'paid',
            actorId: null,
            reason: `ECPay 付款完成 (TradeNo=${tradeNo ?? '-'})`,
          })

          // Bump customer's lifetime spend (tier recalc happens fire-and-forget below)
          await tx
            .update(customers)
            .set({
              totalSpent: sql`${customers.totalSpent} + ${order.total}`,
              totalOrders: sql`${customers.totalOrders} + 1`,
              updatedAt: new Date(),
            })
            .where(eq(customers.id, order.customerId))
        })

        // Recalc tier + auto-issue referral coupon (fire-and-forget; failure must not break ECPay ack)
        void (async () => {
          try {
            const { recalcCustomerTier } = await import('@/server/services/MemberTierService')
            await recalcCustomerTier(order.customerId)
          } catch (e) {
            console.error('[ecpay/callback] tier recalc failed:', e)
          }
          if (order.referredBy) {
            try {
              const { issueAutoCoupons } = await import('@/server/services/AutoCouponService')
              await issueAutoCoupons('referral_complete', [order.referredBy])
            } catch (e) {
              console.error('[ecpay/callback] referral coupon failed:', e)
            }
          }
          // Auto-issue e-invoice (B2C 必開)
          try {
            const { issueInvoiceForOrder } = await import('@/server/services/InvoiceService')
            await issueInvoiceForOrder(order.id)
          } catch (e) {
            console.error('[ecpay/callback] invoice issue failed:', e)
          }
        })()
      } catch (e) {
        console.error('[ecpay/callback] DB update failed:', e)
        return new NextResponse('0|server error', { status: 500 })
      }
    }
    return new NextResponse('1|OK', { status: 200 })
  }

  // Failure / pending — log + ack so ECPay stops retrying
  console.warn('[ecpay/callback] non-success:', { rtnCode, params })
  return new NextResponse('1|OK', { status: 200 })
}
