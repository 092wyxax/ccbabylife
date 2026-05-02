import 'server-only'
import { and, asc, desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  products,
  productImages,
  brands,
  categories,
  type Product,
  type NewProduct,
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

export async function setProductImage(productId: string, imageUrl: string) {
  await db
    .delete(productImages)
    .where(eq(productImages.productId, productId))

  await db.insert(productImages).values({
    orgId: DEFAULT_ORG_ID,
    productId,
    cfImageId: imageUrl,
    isPrimary: true,
    sortOrder: 0,
  })
}

function enforceLegalGuard(input: Partial<ProductInput>) {
  if (input.status === 'active' && input.legalCheckPassed === false) {
    throw new Error(
      '法規檢核未通過的商品不能上架。請先勾選 legalCheckPassed 並補上 legalNotes。'
    )
  }
}
