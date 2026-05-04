'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCustomerSession } from '@/lib/customer-session'
import { requireAdmin } from '@/server/services/AdminAuthService'
import {
  createReview,
  isVerifiedBuyer,
  updateReviewStatus,
} from '@/server/services/ReviewService'
import { recordAudit } from '@/server/services/AuditService'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'

const writeSchema = z.object({
  productId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().optional(),
  body: z.string().min(5, '請至少寫 5 字'),
})

export type WriteReviewState = { error?: string; success?: string }

export async function writeReviewAction(
  _prev: WriteReviewState,
  formData: FormData
): Promise<WriteReviewState> {
  const session = await getCustomerSession()
  if (!session) {
    return { error: '請先登入會員才能評論' }
  }

  const ip = await getClientIp()
  const limit = rateLimit(`review:${ip}`, 5, 60 * 60 * 1000)
  if (!limit.ok) return { error: '評論太頻繁，請稍後再試' }

  const human = await verifyTurnstile(formData.get('cf-turnstile-response') as string | null)
  if (!human) return { error: '人機驗證失敗，請重試' }

  const parsed = writeSchema.safeParse({
    productId: formData.get('productId'),
    rating: formData.get('rating'),
    title: formData.get('title'),
    body: formData.get('body'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }

  const verified = await isVerifiedBuyer(session.customerId, parsed.data.productId)

  await createReview({
    productId: parsed.data.productId,
    customerId: session.customerId,
    rating: parsed.data.rating,
    title: parsed.data.title?.trim() || null,
    body: parsed.data.body.trim(),
    isVerifiedBuyer: verified,
  })

  return { success: '心得已送出，審核通過後會公開顯示' }
}

const moderateSchema = z.object({
  status: z.enum(['approved', 'rejected', 'pending']),
})

export async function moderateReviewFormAction(formData: FormData): Promise<void> {
  const me = await requireAdmin()
  const reviewId = String(formData.get('reviewId') ?? '')
  const parsed = moderateSchema.safeParse({ status: formData.get('status') })
  if (!reviewId || !parsed.success) return

  await updateReviewStatus(reviewId, parsed.data.status)
  await recordAudit({
    actorType: 'admin',
    actorId: me.id,
    actorLabel: me.name,
    action: 'review.moderate',
    entityType: 'review',
    entityId: reviewId,
    data: { status: parsed.data.status },
  })

  revalidatePath('/admin/reviews')
  revalidatePath('/shop/[slug]', 'page')
}
