import 'server-only'
import { and, asc, eq, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { coupons, type Coupon, type CouponType } from '@/db/schema/coupons'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

export { validateCoupon, type CouponValidation } from '@/lib/coupon-validation'

export async function listCoupons(): Promise<Coupon[]> {
  return db
    .select()
    .from(coupons)
    .where(eq(coupons.orgId, DEFAULT_ORG_ID))
    .orderBy(asc(coupons.code))
}

export async function findActiveCouponByCode(code: string): Promise<Coupon | null> {
  const [row] = await db
    .select()
    .from(coupons)
    .where(
      and(
        eq(coupons.orgId, DEFAULT_ORG_ID),
        eq(coupons.code, code.toUpperCase()),
        eq(coupons.isActive, true)
      )
    )
    .limit(1)
  return row ?? null
}

export async function createCoupon(input: {
  code: string
  type: CouponType
  value: number
  minOrderTwd?: number
  maxUses?: number | null
  expiresAt?: Date | null
  notes?: string | null
}): Promise<Coupon> {
  const [row] = await db
    .insert(coupons)
    .values({
      orgId: DEFAULT_ORG_ID,
      code: input.code.toUpperCase(),
      type: input.type,
      value: input.value,
      minOrderTwd: input.minOrderTwd ?? 0,
      maxUses: input.maxUses ?? null,
      expiresAt: input.expiresAt ?? null,
      notes: input.notes ?? null,
    })
    .returning()
  return row
}

export async function toggleCouponActive(id: string): Promise<Coupon> {
  const [existing] = await db
    .select()
    .from(coupons)
    .where(and(eq(coupons.id, id), eq(coupons.orgId, DEFAULT_ORG_ID)))
    .limit(1)
  if (!existing) throw new Error('Coupon not found')

  const [row] = await db
    .update(coupons)
    .set({ isActive: !existing.isActive, updatedAt: new Date() })
    .where(eq(coupons.id, id))
    .returning()
  return row
}

export async function incrementCouponUsage(id: string): Promise<void> {
  await db
    .update(coupons)
    .set({ usedCount: sql`${coupons.usedCount} + 1`, updatedAt: new Date() })
    .where(eq(coupons.id, id))
}
