import 'server-only'
import { and, asc, desc, eq, lte } from 'drizzle-orm'
import { db } from '@/db/client'
import { memberTiers, type MemberTier } from '@/db/schema/member_tiers'
import { customers } from '@/db/schema/customers'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

export async function listTiers(): Promise<MemberTier[]> {
  return db
    .select()
    .from(memberTiers)
    .where(eq(memberTiers.orgId, DEFAULT_ORG_ID))
    .orderBy(asc(memberTiers.thresholdTwd))
}

export async function getTierById(id: string): Promise<MemberTier | null> {
  const [row] = await db
    .select()
    .from(memberTiers)
    .where(and(eq(memberTiers.orgId, DEFAULT_ORG_ID), eq(memberTiers.id, id)))
    .limit(1)
  return row ?? null
}

/** Highest tier whose threshold ≤ totalSpent. */
export async function pickTierFor(totalSpentTwd: number): Promise<MemberTier | null> {
  const [row] = await db
    .select()
    .from(memberTiers)
    .where(
      and(
        eq(memberTiers.orgId, DEFAULT_ORG_ID),
        lte(memberTiers.thresholdTwd, totalSpentTwd)
      )
    )
    .orderBy(desc(memberTiers.thresholdTwd))
    .limit(1)
  return row ?? null
}

/** Recompute customer.tierId from totalSpent. Idempotent. */
export async function recalcCustomerTier(customerId: string): Promise<MemberTier | null> {
  const [c] = await db
    .select({ totalSpent: customers.totalSpent, tierId: customers.tierId })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1)
  if (!c) return null

  const tier = await pickTierFor(c.totalSpent)
  const nextTierId = tier?.id ?? null
  if (nextTierId === c.tierId) return tier

  await db
    .update(customers)
    .set({ tierId: nextTierId, updatedAt: new Date() })
    .where(eq(customers.id, customerId))

  return tier
}

export interface TierInput {
  name: string
  nameJp?: string | null
  color?: string | null
  thresholdTwd: number
  discountBp: number
  freeShipMinTwd?: number | null
  birthdayBonusTwd: number
  perks?: string | null
  sortOrder?: number
}

export async function createTier(input: TierInput): Promise<MemberTier> {
  const [row] = await db
    .insert(memberTiers)
    .values({
      orgId: DEFAULT_ORG_ID,
      name: input.name,
      nameJp: input.nameJp ?? null,
      color: input.color ?? null,
      thresholdTwd: input.thresholdTwd,
      discountBp: input.discountBp,
      freeShipMinTwd: input.freeShipMinTwd ?? null,
      birthdayBonusTwd: input.birthdayBonusTwd,
      perks: input.perks ?? null,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning()
  return row
}

export async function updateTier(id: string, input: TierInput): Promise<MemberTier> {
  const [row] = await db
    .update(memberTiers)
    .set({
      name: input.name,
      nameJp: input.nameJp ?? null,
      color: input.color ?? null,
      thresholdTwd: input.thresholdTwd,
      discountBp: input.discountBp,
      freeShipMinTwd: input.freeShipMinTwd ?? null,
      birthdayBonusTwd: input.birthdayBonusTwd,
      perks: input.perks ?? null,
      sortOrder: input.sortOrder ?? 0,
      updatedAt: new Date(),
    })
    .where(and(eq(memberTiers.id, id), eq(memberTiers.orgId, DEFAULT_ORG_ID)))
    .returning()
  return row
}

export async function deleteTier(id: string): Promise<void> {
  await db.update(customers).set({ tierId: null }).where(eq(customers.tierId, id))
  await db.delete(memberTiers).where(eq(memberTiers.id, id))
}
