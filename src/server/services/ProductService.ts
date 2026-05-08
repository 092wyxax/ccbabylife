import 'server-only'
import { and, asc, desc, eq, ilike, isNotNull, lte, gte, gt, or, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { paged, type Paged, type PageParams } from '@/lib/pagination'
import {
  products,
  productImages,
  brands,
  categories,
  orderItems,
  type Product,
  type NewProduct,
  type ProductImage,
  type Brand,
  type Category,
} from '@/db/schema'
import { purchaseItems } from '@/db/schema/purchases'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

export interface ProductListItem {
  product: Product
  primaryImage: ProductImage | null
}

export async function listActiveProducts(opts?: {
  limit?: number
  categorySlug?: string
  stockType?: 'preorder' | 'in_stock'
}): Promise<ProductListItem[]> {
  const limit = opts?.limit ?? 60

  const conditions = [
    eq(products.orgId, DEFAULT_ORG_ID),
    eq(products.status, 'active'),
  ]

  if (opts?.categorySlug) {
    const cat = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.orgId, DEFAULT_ORG_ID),
          eq(categories.slug, opts.categorySlug)
        )
      )
      .limit(1)
    if (cat[0]) conditions.push(eq(products.categoryId, cat[0].id))
    else return []
  }

  if (opts?.stockType) {
    conditions.push(eq(products.stockType, opts.stockType))
  }

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
    .where(and(...conditions))
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

export interface GiftBudgetTier {
  label: string
  maxTwd: number | null
}

export const GIFT_TIERS: Array<{ key: string; label: string; minTwd: number; maxTwd: number | null }> = [
  { key: 'under500', label: 'NT$500 以下', minTwd: 0, maxTwd: 500 },
  { key: '500to1000', label: 'NT$500–1,000', minTwd: 500, maxTwd: 1000 },
  { key: '1000to3000', label: 'NT$1,000–3,000', minTwd: 1000, maxTwd: 3000 },
  { key: 'over3000', label: 'NT$3,000 以上', minTwd: 3000, maxTwd: null },
]

export async function listGiftProducts(opts: {
  minTwd?: number
  maxTwd?: number | null
}): Promise<ProductListItem[]> {
  const conds = [
    eq(products.orgId, DEFAULT_ORG_ID),
    eq(products.status, 'active'),
    isNotNull(products.minAgeMonths),
  ]
  if (opts.minTwd != null) conds.push(gte(products.priceTwd, opts.minTwd))
  if (opts.maxTwd != null) conds.push(lte(products.priceTwd, opts.maxTwd))

  const rows = await db
    .select({ product: products, image: productImages })
    .from(products)
    .leftJoin(
      productImages,
      and(
        eq(productImages.productId, products.id),
        eq(productImages.isPrimary, true)
      )
    )
    .where(and(...conds))
    .orderBy(asc(products.priceTwd))

  return rows.map((r) => ({ product: r.product, primaryImage: r.image }))
}

export interface AgeBuckets {
  fits: ProductListItem[]
  soon: ProductListItem[]
}

/**
 * 給月齡推薦器使用：把上架中且有設定月齡的商品，依使用者寶寶月齡分群。
 * - fits：當下適用（minAge ≤ age ≤ maxAge）
 * - soon：未來 3 個月內會用到（age < minAge ≤ age + 3）
 * 寵物商品與沒設月齡的商品不會出現。
 */
export async function listProductsByAge(ageMonths: number): Promise<AgeBuckets> {
  const baseConds = [
    eq(products.orgId, DEFAULT_ORG_ID),
    eq(products.status, 'active'),
    isNotNull(products.minAgeMonths),
  ]

  const fitsConds = [
    ...baseConds,
    lte(products.minAgeMonths, ageMonths),
    or(
      gte(products.maxAgeMonths, ageMonths),
      sql`${products.maxAgeMonths} IS NULL`
    )!,
  ]

  const soonConds = [
    ...baseConds,
    gt(products.minAgeMonths, ageMonths),
    lte(products.minAgeMonths, ageMonths + 3),
  ]

  const fitsRows = await db
    .select({ product: products, image: productImages })
    .from(products)
    .leftJoin(
      productImages,
      and(
        eq(productImages.productId, products.id),
        eq(productImages.isPrimary, true)
      )
    )
    .where(and(...fitsConds))
    .orderBy(asc(products.minAgeMonths), desc(products.salesCount))

  const soonRows = await db
    .select({ product: products, image: productImages })
    .from(products)
    .leftJoin(
      productImages,
      and(
        eq(productImages.productId, products.id),
        eq(productImages.isPrimary, true)
      )
    )
    .where(and(...soonConds))
    .orderBy(asc(products.minAgeMonths), desc(products.salesCount))

  return {
    fits: fitsRows.map((r) => ({ product: r.product, primaryImage: r.image })),
    soon: soonRows.map((r) => ({ product: r.product, primaryImage: r.image })),
  }
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

export interface ProductAdminListRow {
  product: Product
  brand: Brand | null
}

export async function listProductsForAdmin(opts: {
  search?: string
  status?: Product['status']
  stockType?: Product['stockType']
  brandId?: string
  page: PageParams
}): Promise<Paged<ProductAdminListRow>> {
  const conds = [eq(products.orgId, DEFAULT_ORG_ID)]
  if (opts.status) conds.push(eq(products.status, opts.status))
  if (opts.stockType) conds.push(eq(products.stockType, opts.stockType))
  if (opts.brandId) conds.push(eq(products.brandId, opts.brandId))
  if (opts.search) {
    const q = `%${opts.search}%`
    conds.push(
      or(
        ilike(products.nameZh, q),
        ilike(products.nameJp, q),
        ilike(products.slug, q)
      )!
    )
  }

  const where = and(...conds)

  const [rows, totalRow] = await Promise.all([
    db
      .select({ product: products, brand: brands })
      .from(products)
      .leftJoin(brands, eq(brands.id, products.brandId))
      .where(where)
      .orderBy(desc(products.createdAt))
      .limit(opts.page.pageSize)
      .offset(opts.page.offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(where),
  ])

  return paged(rows, totalRow[0]?.count ?? 0, opts.page)
}

export async function getProductById(id: string): Promise<Product | null> {
  const row = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.orgId, DEFAULT_ORG_ID)))
    .limit(1)
  return row[0] ?? null
}

export async function listAllBrands(): Promise<Brand[]> {
  return db
    .select()
    .from(brands)
    .where(eq(brands.orgId, DEFAULT_ORG_ID))
    .orderBy(asc(brands.nameZh))
}

export async function listAllCategories(): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .where(eq(categories.orgId, DEFAULT_ORG_ID))
    .orderBy(asc(categories.sortOrder), asc(categories.name))
}

export type ProductInput = Omit<
  NewProduct,
  'id' | 'orgId' | 'createdAt' | 'updatedAt' | 'viewCount' | 'salesCount'
>

export async function createProduct(input: ProductInput): Promise<Product> {
  enforceLegalGuard(input)

  const [row] = await db
    .insert(products)
    .values({
      ...input,
      orgId: DEFAULT_ORG_ID,
    })
    .returning()
  return row
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>
): Promise<Product> {
  enforceLegalGuard(input)

  const [row] = await db
    .update(products)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(products.id, id), eq(products.orgId, DEFAULT_ORG_ID)))
    .returning()
  if (!row) throw new Error(`Product not found: ${id}`)
  return row
}

export async function archiveProduct(id: string): Promise<Product> {
  return updateProduct(id, { status: 'archived' })
}

export class ProductHasReferencesError extends Error {
  constructor(public readonly orderCount: number, public readonly purchaseCount: number) {
    super('Product is referenced by orders or purchase items')
    this.name = 'ProductHasReferencesError'
  }
}

/**
 * Hard-delete a product. Fails if any order_items or purchase_items reference
 * this product (those FKs are not cascade by design). Cascade-deletes
 * product_images, product_variants, restock_subscriptions, reviews.
 */
export async function deleteProduct(id: string): Promise<void> {
  const orderRefs = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .where(eq(orderItems.productId, id))
    .limit(1)
  const purchaseRefs = await db
    .select({ id: purchaseItems.id })
    .from(purchaseItems)
    .where(eq(purchaseItems.productId, id))
    .limit(1)

  if (orderRefs.length > 0 || purchaseRefs.length > 0) {
    throw new ProductHasReferencesError(orderRefs.length, purchaseRefs.length)
  }

  await db.delete(products).where(eq(products.id, id))
}

/**
 * Replace the full image set for a product. Each entry can be either a
 * Supabase Storage path or a legacy http(s) URL (sample seed data).
 * The first entry becomes the primary image.
 */
export async function setProductImages(productId: string, imagePaths: string[]) {
  await db
    .delete(productImages)
    .where(eq(productImages.productId, productId))

  if (imagePaths.length === 0) return

  await db.insert(productImages).values(
    imagePaths.map((path, index) => ({
      orgId: DEFAULT_ORG_ID,
      productId,
      cfImageId: path,
      isPrimary: index === 0,
      sortOrder: index,
    }))
  )
}

function enforceLegalGuard(input: Partial<ProductInput>) {
  if (input.status === 'active' && input.legalCheckPassed === false) {
    throw new Error(
      '法規檢核未通過的商品不能上架。請先勾選 legalCheckPassed 並補上 legalNotes。'
    )
  }
}
