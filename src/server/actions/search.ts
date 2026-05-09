'use server'

import { and, eq, ilike, or } from 'drizzle-orm'
import { db } from '@/db/client'
import { products, productImages } from '@/db/schema/products'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

export interface SearchSuggestion {
  productId: string
  slug: string
  nameZh: string
  priceTwd: number
  imagePath: string | null
}

/**
 * Live-search suggestions: top N matching active products.
 * Triggered as user types in LiveSearchBar (debounced).
 */
export async function searchSuggestionsAction(
  query: string,
  limit = 5
): Promise<SearchSuggestion[]> {
  const q = query.trim()
  if (q.length < 1) return []

  const like = `%${q}%`
  const rows = await db
    .select({
      product: products,
      image: productImages,
    })
    .from(products)
    .leftJoin(
      productImages,
      and(
        eq(productImages.productId, products.id),
        eq(productImages.isPrimary, true)
      )
    )
    .where(
      and(
        eq(products.orgId, DEFAULT_ORG_ID),
        eq(products.status, 'active'),
        or(
          ilike(products.nameZh, like),
          ilike(products.nameJp, like),
          ilike(products.description, like)
        )!
      )
    )
    .limit(limit)

  return rows.map((r) => ({
    productId: r.product.id,
    slug: r.product.slug,
    nameZh: r.product.nameZh,
    priceTwd: r.product.priceTwd,
    imagePath: r.image?.cfImageId ?? null,
  }))
}
