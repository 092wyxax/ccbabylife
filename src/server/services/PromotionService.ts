import 'server-only'
import { and, asc, eq, gt, isNull, lte, or } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  thresholdGifts,
  productAddons,
  type ThresholdGift,
  type ProductAddon,
} from '@/db/schema/promotions'
import { products, type Product } from '@/db/schema/products'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

// ──────────────────────────── Threshold gifts ────────────────────────────

export async function listActiveThresholdGifts(): Promise<ThresholdGift[]> {
  const now = new Date()
  return db
    .select()
    .from(thresholdGifts)
    .where(
      and(
        eq(thresholdGifts.orgId, DEFAULT_ORG_ID),
        eq(thresholdGifts.isActive, true),
        or(isNull(thresholdGifts.startsAt), lte(thresholdGifts.startsAt, now))!,
        or(isNull(thresholdGifts.expiresAt), gt(thresholdGifts.expiresAt, now))!
      )
    )
    .orderBy(asc(thresholdGifts.thresholdTwd))
}

export async function listAllThresholdGifts(): Promise<
  Array<{ gift: ThresholdGift; product: Product | null }>
> {
  const rows = await db
    .select({ gift: thresholdGifts, product: products })
    .from(thresholdGifts)
    .leftJoin(products, eq(products.id, thresholdGifts.giftProductId))
    .where(eq(thresholdGifts.orgId, DEFAULT_ORG_ID))
    .orderBy(asc(thresholdGifts.thresholdTwd))
  return rows
}

export interface AppliedGift {
  gift: ThresholdGift
  product: Product
}

/** Returns gifts the cart subtotal qualifies for (eligible to be added). */
export async function findEligibleGifts(subtotalTwd: number): Promise<AppliedGift[]> {
  const active = await listActiveThresholdGifts()
  const eligible = active.filter((g) => subtotalTwd >= g.thresholdTwd)
  if (eligible.length === 0) return []

  const ids = Array.from(new Set(eligible.map((g) => g.giftProductId)))
  const productRows = await db.select().from(products).where(eq(products.orgId, DEFAULT_ORG_ID))
  const byId = new Map(productRows.map((p) => [p.id, p]))

  return eligible
    .map((g) => {
      const p = byId.get(g.giftProductId)
      if (!p || p.status !== 'active') return null
      return { gift: g, product: p } as AppliedGift
    })
    .filter((x): x is AppliedGift => x !== null && ids.includes(x.product.id))
}

/** "Next gift" hint for cart UI: returns the next threshold above current subtotal. */
export async function nextGiftAbove(
  subtotalTwd: number
): Promise<{ gift: ThresholdGift; product: Product; remaining: number } | null> {
  const active = await listActiveThresholdGifts()
  const next = active.find((g) => g.thresholdTwd > subtotalTwd)
  if (!next) return null
  const [p] = await db.select().from(products).where(eq(products.id, next.giftProductId)).limit(1)
  if (!p || p.status !== 'active') return null
  return { gift: next, product: p, remaining: next.thresholdTwd - subtotalTwd }
}

export async function getGiftById(id: string): Promise<ThresholdGift | null> {
  const [row] = await db
    .select()
    .from(thresholdGifts)
    .where(and(eq(thresholdGifts.id, id), eq(thresholdGifts.orgId, DEFAULT_ORG_ID)))
    .limit(1)
  return row ?? null
}

export interface ThresholdGiftInput {
  name: string
  thresholdTwd: number
  giftProductId: string
  quantity?: number
  isActive?: boolean
  startsAt?: Date | null
  expiresAt?: Date | null
  sortOrder?: number
}

export async function createThresholdGift(input: ThresholdGiftInput): Promise<ThresholdGift> {
  const [row] = await db
    .insert(thresholdGifts)
    .values({
      orgId: DEFAULT_ORG_ID,
      name: input.name,
      thresholdTwd: input.thresholdTwd,
      giftProductId: input.giftProductId,
      quantity: input.quantity ?? 1,
      isActive: input.isActive ?? true,
      startsAt: input.startsAt ?? null,
      expiresAt: input.expiresAt ?? null,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning()
  return row
}

export async function updateThresholdGift(
  id: string,
  input: ThresholdGiftInput
): Promise<ThresholdGift> {
  const [row] = await db
    .update(thresholdGifts)
    .set({
      name: input.name,
      thresholdTwd: input.thresholdTwd,
      giftProductId: input.giftProductId,
      quantity: input.quantity ?? 1,
      isActive: input.isActive ?? true,
      startsAt: input.startsAt ?? null,
      expiresAt: input.expiresAt ?? null,
      sortOrder: input.sortOrder ?? 0,
      updatedAt: new Date(),
    })
    .where(and(eq(thresholdGifts.id, id), eq(thresholdGifts.orgId, DEFAULT_ORG_ID)))
    .returning()
  return row
}

export async function deleteThresholdGift(id: string): Promise<void> {
  await db
    .delete(thresholdGifts)
    .where(and(eq(thresholdGifts.id, id), eq(thresholdGifts.orgId, DEFAULT_ORG_ID)))
}

// ──────────────────────────── Product add-ons ────────────────────────────

export async function listAddonsForMain(mainProductId: string): Promise<
  Array<{ addon: ProductAddon; product: Product }>
> {
  const rows = await db
    .select({ addon: productAddons, product: products })
    .from(productAddons)
    .innerJoin(products, eq(products.id, productAddons.addonProductId))
    .where(
      and(
        eq(productAddons.orgId, DEFAULT_ORG_ID),
        eq(productAddons.mainProductId, mainProductId),
        eq(productAddons.isActive, true),
        eq(products.status, 'active')
      )
    )
    .orderBy(asc(productAddons.sortOrder))
  return rows
}

export async function listAllAddons(): Promise<
  Array<{ addon: ProductAddon; main: Product | null; sub: Product | null }>
> {
  const main = products
  const sub = products
  const rows = await db
    .select({
      addon: productAddons,
      main,
      sub,
    })
    .from(productAddons)
    .leftJoin(main, eq(main.id, productAddons.mainProductId))
    .leftJoin(sub, eq(sub.id, productAddons.addonProductId))
    .where(eq(productAddons.orgId, DEFAULT_ORG_ID))
    .orderBy(asc(productAddons.sortOrder))
  return rows.map((r) => ({ addon: r.addon, main: r.main, sub: r.sub }))
}

export interface ProductAddonInput {
  mainProductId: string
  addonProductId: string
  addonPriceTwd: number
  maxAddonQty?: number
  isActive?: boolean
  sortOrder?: number
}

export async function createAddon(input: ProductAddonInput): Promise<ProductAddon> {
  const [row] = await db
    .insert(productAddons)
    .values({
      orgId: DEFAULT_ORG_ID,
      mainProductId: input.mainProductId,
      addonProductId: input.addonProductId,
      addonPriceTwd: input.addonPriceTwd,
      maxAddonQty: input.maxAddonQty ?? 1,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning()
  return row
}

export async function deleteAddon(id: string): Promise<void> {
  await db
    .delete(productAddons)
    .where(and(eq(productAddons.id, id), eq(productAddons.orgId, DEFAULT_ORG_ID)))
}
