import 'server-only'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { customers, type Customer } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { generateReferralCode } from '@/lib/referral'

export async function ensureReferralCode(customerId: string): Promise<string> {
  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.orgId, DEFAULT_ORG_ID)))
    .limit(1)
  if (!customer) throw new Error('Customer not found')
  if (customer.referralCode) return customer.referralCode

  // Try up to 5 times to generate a unique code
  for (let i = 0; i < 5; i++) {
    const code = generateReferralCode()
    const existing = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.referralCode, code))
      .limit(1)
    if (existing.length === 0) {
      await db
        .update(customers)
        .set({ referralCode: code, updatedAt: new Date() })
        .where(eq(customers.id, customerId))
      return code
    }
  }
  throw new Error('Failed to allocate unique referral code')
}

export async function findCustomerByReferralCode(
  code: string
): Promise<Customer | null> {
  const [row] = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.orgId, DEFAULT_ORG_ID),
        eq(customers.referralCode, code.toUpperCase())
      )
    )
    .limit(1)
  return row ?? null
}
