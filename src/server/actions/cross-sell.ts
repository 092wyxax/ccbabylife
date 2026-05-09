'use server'

import { and, eq, inArray, not, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { products, productImages } from '@/db/schema/products'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

export interface CrossSellSuggestion {
  productId: string
  slug: string
  nameZh: string
  priceTwd: number
  weightG: number
  stockType: 'preorder' | 'in_stock'
  imagePath: string | null
}

/**
 * Pick N suggestions that share at least one categoryId with cart items
 * but aren't already in the cart. Falls back to top-selling active products.
 */
export async function fetchCrossSellAction(
  cartProductIds: string[],
  limit = 3
): Promise<CrossSellSuggestion[]> {
  if (cartProductIds.length === 0) return []

  // 1. Get cart products' category ids
  const cartRows = await db
    .select({ categoryId: products.categoryId })
    .from(products)
    .where(inArray(products.id, cartProductIds))

  const catIds = Array.from(
    new Set(cartRows.map((r) => r.categoryId).filter((x): x is string => Boolean(x)))
  )

  // 2. Find sibling products in those categories, excluding cart items
  const conds = [
    eq(products.orgId, DEFAULT_ORG_ID),
    eq(products.status, 'active'),
    not(inArray(products.id, cartProductIds)),
  ]
  if (catIds.length > 0) {
    conds.push(inArray(products.categoryId, catIds))
  }

  const rows = await db
    .select({
      product: products,
      image: productImages,
    })
    .from(products)
    .leftJoin(
      productImages,
      and(eq(productImages.productId, products.id), eq(productImages.isPrimary, true))
    )
    .where(and(...conds))
    .orderBy(sql`${products.salesCount} desc, ${products.createdAt} desc`)
    .limit(limit)

  return rows.map((r) => ({
    productId: r.product.id,
    slug: r.product.slug,
    nameZh: r.product.nameZh,
    priceTwd: r.product.priceTwd,
    weightG: r.product.weightG,
    stockType: r.product.stockType as 'preorder' | 'in_stock',
    imagePath: r.image?.cfImageId ?? null,
  }))
}
