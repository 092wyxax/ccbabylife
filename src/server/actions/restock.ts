'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { restockSubscriptions, products, customers } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'
import { requireRole } from '@/server/services/AdminAuthService'
import { enqueuePush } from '@/server/services/NotificationService'
import { issueAutoCoupons } from '@/server/services/AutoCouponService'

const subscribeSchema = z.object({
  productId: z.string().uuid(),
  email: z.string().email('請填正確 email'),
})

export type RestockState = { error?: string; success?: string }

export async function subscribeRestockAction(
  _prev: RestockState,
  formData: FormData
): Promise<RestockState> {
  const ip = await getClientIp()
  const limit = rateLimit(`restock:${ip}`, 10, 60 * 60 * 1000)
  if (!limit.ok) {
    return { error: '操作太頻繁，請稍後再試' }
  }

  const human = await verifyTurnstile(formData.get('cf-turnstile-response') as string | null)
  if (!human) {
    return { error: '人機驗證失敗，請重試' }
  }

  const parsed = subscribeSchema.safeParse({
    productId: formData.get('productId'),
    email: formData.get('email'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }

  const email = parsed.data.email.toLowerCase()

  // Verify product exists and is currently out of stock
  const [product] = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.orgId, DEFAULT_ORG_ID),
        eq(products.id, parsed.data.productId)
      )
    )
    .limit(1)
  if (!product) return { error: '商品不存在' }

  // Idempotent insert
  const existing = await db
    .select()
    .from(restockSubscriptions)
    .where(
      and(
        eq(restockSubscriptions.productId, parsed.data.productId),
        eq(restockSubscriptions.email, email)
      )
    )
    .limit(1)

  if (existing[0]) {
    if (existing[0].notified) {
      // already received notification; reset for next time
      await db
        .update(restockSubscriptions)
        .set({ notified: false, notifiedAt: null })
        .where(eq(restockSubscriptions.id, existing[0].id))
    }
    return { success: '已登記，補貨後會用 Email 通知妳' }
  }

  await db.insert(restockSubscriptions).values({
    orgId: DEFAULT_ORG_ID,
    productId: parsed.data.productId,
    email,
  })

  return { success: '已登記，補貨後會用 Email 通知妳' }
}

export async function sendRestockNotificationAction(formData: FormData): Promise<void> {
  await requireRole(['owner', 'manager', 'ops', 'editor'])

  const subId = String(formData.get('subId') ?? '')
  if (!subId) return

  const [sub] = await db
    .select()
    .from(restockSubscriptions)
    .where(
      and(
        eq(restockSubscriptions.id, subId),
        eq(restockSubscriptions.orgId, DEFAULT_ORG_ID)
      )
    )
    .limit(1)
  if (!sub || sub.notified) return

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, sub.productId))
    .limit(1)
  if (!product) return

  // Match the email to a known customer (if any) for coupon issuance
  const [matchingCustomer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(
      and(
        eq(customers.orgId, DEFAULT_ORG_ID),
        eq(customers.email, sub.email.toLowerCase())
      )
    )
    .limit(1)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ccbabylife.com'
  const productUrl = `${siteUrl}/shop/${product.slug}`
  const subject = `補貨通知：${product.nameZh}`
  const body = `好消息！你關注的「${product.nameZh}」已重新到貨 🎉\n\n👉 立即選購：${productUrl}`

  if (matchingCustomer) {
    await enqueuePush({
      customerId: matchingCustomer.id,
      channel: 'email',
      templateId: 'restock.filled',
      subject,
      body,
      payload: { productId: product.id, productSlug: product.slug },
    }).catch((e) => console.error('[restock] email enqueue failed', e))

    await issueAutoCoupons('restock_filled', [matchingCustomer.id]).catch((e) =>
      console.error('[restock] coupon issue failed', e)
    )
  } else {
    // Guest subscriber (no customer record) — log so admin can email manually
    console.info(
      `[restock] guest subscriber ${sub.email} for ${product.nameZh} — manual email needed`
    )
  }

  await db
    .update(restockSubscriptions)
    .set({ notified: true, notifiedAt: new Date() })
    .where(eq(restockSubscriptions.id, subId))

  revalidatePath('/admin/restock')
}
