import 'server-only'
import { and, asc, desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  products,
  productImages,
  brands,
  categories,
  type Product,
  type ProductImage,
  type Brand,
  type Category,
} from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

export interface ProductListItem {
  product: Product
  primaryImage: ProductImage | null
}

export async function listActiveProducts(opts?: {
  limit?: number
}): Promise<ProductListItem[]> {
  const limit = opts?.limit ?? 60

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
        eq(products.status, 'active')
      )
    )
    .orderBy(desc(products.salesCount), desc(products.createdAt))
    .limit(limit)

  return rows.map((row) => ({
    product: row.product,
    primaryImage: row.image,
  }))
}

export interface ProductDetail {
  product: Product
  brand: Brand | null
  category: Category | null
  images: ProductImage[]
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const productRows = await db
    .select({
      product: products,
      brand: brands,
      category: categories,
    })
    .from(products)
    .leftJoin(brands, eq(brands.id, products.brandId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(
      and(
        eq(products.orgId, DEFAULT_ORG_ID),
        eq(products.slug, slug)
      )
    )
    .limit(1)

  const row = productRows[0]
  if (!row) return null

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, row.product.id))
    .orderBy(asc(productImages.sortOrder))

  return {
    product: row.product,
    brand: row.brand,
    category: row.category,
    images,
  }
}
