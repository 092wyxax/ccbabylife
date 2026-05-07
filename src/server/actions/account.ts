'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { orders, customers } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import {
  setCustomerSession,
  clearCustomerSession,
  getCustomerSession,
} from '@/lib/customer-session'
import { revalidatePath } from 'next/cache'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const lookupSchema = z.object({
  orderNumber: z.string().min(1, '請填訂單編號'),
  email: z.string().email('請填正確 email'),
})

export type LookupState = { error?: string }

export async function lookupOrderAction(
  _prev: LookupState,
  formData: FormData
): Promise<LookupState> {
  const ip = await getClientIp()
  const limit = rateLimit(`order-lookup:${ip}`, 5, 10 * 60 * 1000)
  if (!limit.ok) {
    return { error: '嘗試太頻繁，請稍後再試' }
  }

  const parsed = lookupSchema.safeParse({
    orderNumber: formData.get('orderNumber'),
    email: formData.get('email'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  }

  const row = await db
    .select({ order: orders, customer: customers })
    .from(orders)
    .leftJoin(customers, eq(customers.id, orders.customerId))
    .where(
      and(
        eq(orders.orgId, DEFAULT_ORG_ID),
        eq(orders.orderNumber, parsed.data.orderNumber)
      )
    )
    .limit(1)

  const found = row[0]
  if (!found) {
    return { error: '查無此訂單編號' }
  }

  const inputEmail = parsed.data.email.toLowerCase()
  const recipientEmail = found.order.recipientEmail.toLowerCase()
  const customerEmail = found.customer?.email.toLowerCase()
  if (inputEmail !== recipientEmail && inputEmail !== customerEmail) {
    return { error: 'Email 與訂單登記不符' }
  }

  // Set client session so /account/orders shows full history
  if (found.customer) {
    await setCustomerSession({
      customerId: found.customer.id,
      email: found.customer.email,
    })
  }

  redirect(`/track/${found.order.id}`)
}

export async function logoutAccountAction(): Promise<void> {
  await clearCustomerSession()
  redirect('/account')
}

const prefsSchema = z.object({
  line: z.coerce.boolean(),
  email: z.coerce.boolean(),
})

export type PrefsState = { error?: string; success?: string }

export async function updateNotificationPrefsAction(
  _prev: PrefsState,
  formData: FormData
): Promise<PrefsState> {
  const session = await getCustomerSession()
  if (!session) return { error: '請先登入' }

  const parsed = prefsSchema.safeParse({
    line: formData.get('line') === 'on',
    email: formData.get('email') === 'on',
  })
  if (!parsed.success) return { error: '輸入錯誤' }

  await db
    .update(customers)
    .set({
      notificationPrefs: parsed.data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(customers.id, session.customerId),
        eq(customers.orgId, DEFAULT_ORG_ID)
      )
    )

  revalidatePath('/account/settings')
  return { success: '已更新通知偏好' }
}

const babyInfoSchema = z.object({
  babyBirthDate: z.string().optional().or(z.literal('')),
})

export type BabyInfoState = { error?: string; success?: string }

export async function updateBabyInfoAction(
  _prev: BabyInfoState,
  formData: FormData
): Promise<BabyInfoState> {
  const session = await getCustomerSession()
  if (!session) return { error: '請先登入' }

  const parsed = babyInfoSchema.safeParse({
    babyBirthDate: (formData.get('babyBirthDate') as string) || '',
  })
  if (!parsed.success) return { error: '日期格式錯誤' }

  const value = parsed.data.babyBirthDate || null
  if (!value) return { error: '請選擇日期' }

  const d = new Date(value)
  if (isNaN(d.getTime())) return { error: '日期格式錯誤' }
  const now = new Date()
  if (d > now) return { error: '寶寶生日不能在未來' }
  const tooOld = new Date()
  tooOld.setFullYear(tooOld.getFullYear() - 20)
  if (d < tooOld) return { error: '寶寶生日不可早於 20 年前' }

  // Refuse if already set — write-once only
  const [existing] = await db
    .select({ babyBirthDate: customers.babyBirthDate })
    .from(customers)
    .where(eq(customers.id, session.customerId))
    .limit(1)
  if (existing?.babyBirthDate) {
    return { error: '寶寶生日已設定，無法修改。如需更正請聯繫 LINE 客服。' }
  }

  await db
    .update(customers)
    .set({
      babyBirthDate: value,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(customers.id, session.customerId),
        eq(customers.orgId, DEFAULT_ORG_ID)
      )
    )

  revalidatePath('/account/settings')
  return { success: '已儲存寶寶生日 🎁 我們會在當天送你優惠券' }
}
