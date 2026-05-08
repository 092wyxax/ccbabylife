'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCustomerSession } from '@/lib/customer-session'
import {
  saveSubscription,
  deleteSubscription,
} from '@/server/services/WebPushService'

export type PushSubState = { error?: string; success?: string }

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dhKey: z.string().min(1),
  authKey: z.string().min(1),
  userAgent: z.string().optional(),
})

export async function subscribePushAction(payload: {
  endpoint: string
  p256dhKey: string
  authKey: string
  userAgent?: string
}): Promise<PushSubState> {
  const parsed = subscribeSchema.safeParse(payload)
  if (!parsed.success) return { error: '訂閱資料格式錯誤' }

  const session = await getCustomerSession()
  await saveSubscription({
    customerId: session?.customerId ?? null,
    endpoint: parsed.data.endpoint,
    p256dhKey: parsed.data.p256dhKey,
    authKey: parsed.data.authKey,
    userAgent: parsed.data.userAgent,
  })

  revalidatePath('/account/settings')
  return { success: '已開啟瀏覽器推送通知' }
}

export async function unsubscribePushAction(endpoint: string): Promise<PushSubState> {
  if (!endpoint) return { error: '缺少 endpoint' }
  await deleteSubscription(endpoint)
  revalidatePath('/account/settings')
  return { success: '已關閉瀏覽器推送通知' }
}
