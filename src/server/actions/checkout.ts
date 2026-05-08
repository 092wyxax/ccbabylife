'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { customers, orders, orderItems, products } from '@/db/schema'
import { customerCoupons } from '@/db/schema/customer_coupons'
import { cartSnapshots } from '@/db/schema/cart_snapshots'
import { findEligibleGifts } from '@/server/services/PromotionService'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { shippingFee } from '@/lib/pricing'
import { findCustomerByReferralCode } from '@/server/services/ReferralService'
import { REFERRAL_COOKIE } from '@/lib/referral'
import {
  findActiveCouponByCode,
  incrementCouponUsage,
  validateCoupon,
} from '@/server/services/CouponService'
import { ACTIVE_COUPON_COOKIE } from '@/lib/active-coupon'
import type { CartItem } from '@/types/cart'

const cartItemSchema = z.object({
  productId: z.string().uuid(),
  slug: z.string(),
  nameZh: z.string(),
  priceTwd: z.number().int().nonnegative(),
  weightG: z.number().int().nonnegative(),
  imagePath: z.string().nullable(),
  stockType: z.enum(['preorder', 'in_stock']),
  quantity: z.number().int().positive(),
})

const checkoutSchema = z.object({
  recipientName: z.string().min(1, '請填收件人姓名'),
  recipientPhone: z.string().min(8, '請填正確電話'),
  recipientEmail: z.string().email('請填正確 email'),
  recipientLineId: z.string().optional().or(z.literal('')),
  recipientCity: z.string().min(1, '請選擇縣市'),
  recipientZip: z.string().min(3, '請填郵遞區號'),
  recipientAddress: z.string().min(5, '請填詳細地址'),
  babyBirthDate: z.string().optional().or(z.literal('')),
  cartJson: z.string().min(2),
  couponCode: z.string().optional(),
})

export type CheckoutState = { error?: string; fieldErrors?: Record<string, string> }

function makeOrderNumber(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const seq = String(now.getTime()).slice(-6)
  return `N${date}${seq}`
}

export async function checkoutAction(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const parsed = checkoutSchema.safeParse({
    recipientName: formData.get('recipientName'),
    recipientPhone: formData.get('recipientPhone'),
    recipientEmail: formData.get('recipientEmail'),
    recipientLineId: formData.get('recipientLineId') ?? '',
    recipientCity: formData.get('recipientCity'),
    recipientZip: formData.get('recipientZip'),
    recipientAddress: formData.get('recipientAddress'),
    babyBirthDate: (formData.get('babyBirthDate') as string) || '',
    cartJson: formData.get('cartJson'),
    couponCode: (formData.get('couponCode') as string) || undefined,
  })
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.')
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message
    }
    return { error: '輸入驗證失敗', fieldErrors }
  }

  let cart: CartItem[]
  try {
    cart = z.array(cartItemSchema).parse(JSON.parse(parsed.data.cartJson))
  } catch {
    return { error: '購物車內容格式錯誤，請重新整理頁面再試' }
  }
  if (cart.length === 0) {
    return { error: '購物車是空的' }
  }

  // Verify products exist + status active + take fresh prices
  const productRows = await db
    .select()
    .from(products)
    .where(eq(products.orgId, DEFAULT_ORG_ID))

  const byId = new Map(productRows.map((p) => [p.id, p]))
  for (const item of cart) {
    const p = byId.get(item.productId)
    if (!p || p.status !== 'active') {
      return { error: `「${item.nameZh}」目前無法購買，請從購物車移除` }
    }
  }

  // Calc totals using current product prices (do not trust client)
  const lineItems = cart.map((c) => {
    const p = byId.get(c.productId)!
    return {
      product: p,
      quantity: c.quantity,
      lineTotal: p.priceTwd * c.quantity,
      weight: p.weightG * c.quantity,
    }
  })

  const subtotal = lineItems.reduce((s, l) => s + l.lineTotal, 0)
  const totalWeight = lineItems.reduce((s, l) => s + l.weight, 0)
  const ship = shippingFee(totalWeight)
  const computedShipBase = ship < 0 ? 0 : ship // > 5kg requires manual quote — for shell, set 0 and flag in notes

  // Validate coupon (if any) against the actual server-computed subtotal
  let appliedCouponId: string | null = null
  let appliedCouponCode: string | null = null
  let couponDiscount = 0
  let couponFreeShipping = false
  if (parsed.data.couponCode && parsed.data.couponCode.trim()) {
    const candidate = await findActiveCouponByCode(parsed.data.couponCode.trim())
    if (candidate) {
      const v = validateCoupon(candidate, subtotal, {
        cartLines: lineItems.map((l) => ({
          productId: l.product.id,
          categorySlug: null,
          amountTwd: l.lineTotal,
        })),
      })
      if (v.ok) {
        appliedCouponId = candidate.id
        appliedCouponCode = candidate.code
        couponDiscount = v.discountAmount ?? 0
        couponFreeShipping = Boolean(v.freeShipping)
      }
    }
  }

  const computedShip = couponFreeShipping ? 0 : computedShipBase
  const total = Math.max(0, subtotal + computedShip - couponDiscount)

  // Resolve referral cookie → referredBy customer
  const cookieStore = await cookies()
  const refCode = cookieStore.get(REFERRAL_COOKIE)?.value
  const referrer = refCode ? await findCustomerByReferralCode(refCode) : null

  // Parse baby birth date once
  const babyBirthDateStr = parsed.data.babyBirthDate || null
  let babyAgeMonths: number | null = null
  if (babyBirthDateStr) {
    const born = new Date(babyBirthDateStr)
    if (!isNaN(born.getTime())) {
      const now = new Date()
      babyAgeMonths =
        (now.getFullYear() - born.getFullYear()) * 12 +
        (now.getMonth() - born.getMonth())
      if (babyAgeMonths < 0 || babyAgeMonths > 240) babyAgeMonths = null
    }
  }

  let orderId: string
  try {
    orderId = await db.transaction(async (tx) => {
      // Upsert customer by email
      const inputEmail = parsed.data.recipientEmail.toLowerCase()
      const existing = await tx
        .select()
        .from(customers)
        .where(
          and(
            eq(customers.orgId, DEFAULT_ORG_ID),
            eq(customers.email, inputEmail)
          )
        )
        .limit(1)

      let customerId: string
      if (existing[0]) {
        if (existing[0].isBlacklisted) {
          throw new Error('此 Email 帳號目前無法下單，請聯繫 LINE 客服')
        }
        customerId = existing[0].id
        await tx
          .update(customers)
          .set({
            name: parsed.data.recipientName,
            phone: parsed.data.recipientPhone,
            // Only set babyBirthDate if it's currently null (don't overwrite a date the customer set explicitly)
            ...(babyBirthDateStr && !existing[0].babyBirthDate
              ? { babyBirthDate: babyBirthDateStr }
              : {}),
            updatedAt: new Date(),
          })
          .where(eq(customers.id, customerId))
      } else {
        const [created] = await tx
          .insert(customers)
          .values({
            orgId: DEFAULT_ORG_ID,
            email: inputEmail,
            name: parsed.data.recipientName,
            phone: parsed.data.recipientPhone,
            lineUserId: parsed.data.recipientLineId || null,
            babyBirthDate: babyBirthDateStr,
          })
          .returning()
        customerId = created.id
      }

      const [order] = await tx
        .insert(orders)
        .values({
          orgId: DEFAULT_ORG_ID,
          orderNumber: makeOrderNumber(),
          customerId,
          status: 'pending_payment',
          paymentStatus: 'pending',
          subtotal,
          shippingFee: computedShip,
          tax: 0,
          storeCreditUsed: 0,
          couponCode: appliedCouponCode,
          couponDiscount,
          total,
          shippingAddress: {
            recipientName: parsed.data.recipientName,
            phone: parsed.data.recipientPhone,
            zipcode: parsed.data.recipientZip,
            city: parsed.data.recipientCity,
            address: parsed.data.recipientAddress,
          },
          recipientLineId: parsed.data.recipientLineId || null,
          recipientEmail: parsed.data.recipientEmail,
          babyAgeMonths,
          isPreorder: lineItems.some((l) => l.product.stockType === 'preorder'),
          notes: ship < 0 ? '> 5kg：運費需個案估算，已暫設 0，待人工確認' : null,
          referredBy: referrer && referrer.id !== customerId ? referrer.id : null,
        })
        .returning()

      await tx.insert(orderItems).values(
        lineItems.map((l) => ({
          orgId: DEFAULT_ORG_ID,
          orderId: order.id,
          productId: l.product.id,
          productNameSnapshot: l.product.nameZh,
          priceTwdSnapshot: l.product.priceTwd,
          quantity: l.quantity,
          lineTotal: l.lineTotal,
        }))
      )

      // Threshold gifts: auto-append as 0-priced order items
      const eligibleGifts = await findEligibleGifts(subtotal)
      if (eligibleGifts.length > 0) {
        await tx.insert(orderItems).values(
          eligibleGifts.map((g) => ({
            orgId: DEFAULT_ORG_ID,
            orderId: order.id,
            productId: g.product.id,
            productNameSnapshot: `${g.product.nameZh}（贈品 · ${g.gift.name}）`,
            priceTwdSnapshot: 0,
            quantity: g.gift.quantity,
            lineTotal: 0,
          }))
        )
      }

      if (appliedCouponId) {
        // Mark customer_coupons.usedAt if this coupon was granted to this customer
        await tx
          .update(customerCoupons)
          .set({ usedAt: new Date() })
          .where(
            and(
              eq(customerCoupons.couponId, appliedCouponId),
              eq(customerCoupons.customerId, customerId)
            )
          )
      }

      return order.id
    })
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }

  if (appliedCouponId) {
    await incrementCouponUsage(appliedCouponId).catch(() => {})
    cookieStore.delete(ACTIVE_COUPON_COOKIE)
  }

  // Mark cart snapshot as recovered (for analytics) — by customerId or email
  await db
    .update(cartSnapshots)
    .set({ recoveredAt: new Date() })
    .where(eq(cartSnapshots.email, parsed.data.recipientEmail.toLowerCase()))
    .catch(() => {})

  revalidatePath('/admin/orders')
  revalidatePath('/admin/customers')
  // Redirect to the payment relay page; if ECPay isn't configured the relay
  // page shows a "manual payment" notice instead.
  redirect(`/pay/${orderId}`)
}
