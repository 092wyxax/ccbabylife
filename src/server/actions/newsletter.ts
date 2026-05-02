'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { newsletterSubscribers } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

const subscribeSchema = z.object({
  email: z.string().email('請填正確 email'),
  source: z.string().optional(),
})

export type SubscribeState = { error?: string; success?: string }

export async function subscribeNewsletterAction(
  _prev: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  const parsed = subscribeSchema.safeParse({
    email: formData.get('email'),
    source: formData.get('source') ?? 'footer',
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  }

  const email = parsed.data.email.toLowerCase()

  const existing = await db
    .select()
    .from(newsletterSubscribers)
    .where(
      and(
        eq(newsletterSubscribers.orgId, DEFAULT_ORG_ID),
        eq(newsletterSubscribers.email, email)
      )
    )
    .limit(1)

  if (existing[0]) {
    if (existing[0].isActive) return { success: '已訂閱過了，謝謝！' }
    await db
      .update(newsletterSubscribers)
      .set({ isActive: true, unsubscribedAt: null })
      .where(eq(newsletterSubscribers.id, existing[0].id))
  } else {
    await db.insert(newsletterSubscribers).values({
      orgId: DEFAULT_ORG_ID,
      email,
      source: parsed.data.source ?? null,
    })
  }

  revalidatePath('/admin/newsletter')
  return { success: '已訂閱，新選物上架會通知妳' }
}
