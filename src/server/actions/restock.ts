'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { restockSubscriptions, products } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'

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
