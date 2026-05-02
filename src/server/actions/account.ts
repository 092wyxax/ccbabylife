'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { orders, customers } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

const lookupSchema = z.object({
  orderNumber: z.string().min(1, '請填訂單編號'),
  email: z.string().email('請填正確 email'),
})

export type LookupState = { error?: string }

export async function lookupOrderAction(
  _prev: LookupState,
  formData: FormData
): Promise<LookupState> {
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

  // Verify email matches the recipient OR customer email (case-insensitive)
  const inputEmail = parsed.data.email.toLowerCase()
  const recipientEmail = found.order.recipientEmail.toLowerCase()
  const customerEmail = found.customer?.email.toLowerCase()
  if (inputEmail !== recipientEmail && inputEmail !== customerEmail) {
    return { error: 'Email 與訂單登記不符' }
  }

  redirect(`/track/${found.order.id}`)
}
