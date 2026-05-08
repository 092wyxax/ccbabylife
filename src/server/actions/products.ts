'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/server/services/AdminAuthService'
import {
  createProduct,
  updateProduct,
  archiveProduct,
  deleteProduct,
  setProductImages,
  ProductHasReferencesError,
} from '@/server/services/ProductService'
import { uploadProductImage, deleteProductImage } from '@/lib/supabase/storage'
import { productStockTypeEnum, productStatusEnum } from '@/db/schema'

const productInputSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'slug 只能包含小寫英數與短橫線'),
  nameZh: z.string().min(1, '請填中文品名'),
  nameJp: z.string().optional().or(z.literal('')),
  brandId: z.string().uuid().optional().or(z.literal('')),
  categoryId: z.string().uuid().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  useExperience: z.string().optional().or(z.literal('')),
  minAgeMonths: z.coerce.number().int().min(0).max(240).optional(),
  maxAgeMonths: z.coerce.number().int().min(0).max(240).optional(),
  priceJpy: z.coerce.number().int().nonnegative(),
  priceTwd: z.coerce.number().int().nonnegative(),
  costJpy: z.coerce.number().int().nonnegative().optional(),
  weightG: z.coerce.number().int().positive(),
  stockType: z.enum(productStockTypeEnum),
  stockQuantity: z.coerce.number().int().nonnegative().default(0),
  status: z.enum(productStatusEnum),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  legalCheckPassed: z.coerce.boolean(),
  legalNotes: z.string().optional().or(z.literal('')),
})

function getKeptImagePaths(formData: FormData): string[] {
  return formData.getAll('keepImagePath').map(String).filter(Boolean)
}

function getNewImageFiles(formData: FormData): File[] {
  return formData
    .getAll('newImageFiles')
    .filter((v): v is File => v instanceof File && v.size > 0)
}

export type ProductFormState = {
  error?: string
  fieldErrors?: Record<string, string>
}

function parseFormData(formData: FormData) {
  const fields = [
    'slug', 'nameZh', 'nameJp', 'brandId', 'categoryId',
    'description', 'useExperience',
    'minAgeMonths', 'maxAgeMonths',
    'priceJpy', 'priceTwd', 'costJpy', 'weightG',
    'stockType', 'stockQuantity', 'status',
    'sourceUrl', 'legalNotes',
  ]
  const obj: Record<string, string> = {}
  for (const f of fields) {
    const v = formData.get(f)
    if (typeof v === 'string') obj[f] = v
  }
  obj.legalCheckPassed = formData.get('legalCheckPassed') ? 'true' : 'false'
  return obj
}

function normalize(input: z.infer<typeof productInputSchema>) {
  return {
    slug: input.slug,
    nameZh: input.nameZh,
    nameJp: input.nameJp || null,
    brandId: input.brandId || null,
    categoryId: input.categoryId || null,
    description: input.description || null,
    useExperience: input.useExperience || null,
    minAgeMonths: input.minAgeMonths ?? null,
    maxAgeMonths: input.maxAgeMonths ?? null,
    priceJpy: input.priceJpy,
    priceTwd: input.priceTwd,
    costJpy: input.costJpy ?? null,
    weightG: input.weightG,
    stockType: input.stockType,
    stockQuantity: input.stockQuantity,
    status: input.status,
    sourceUrl: input.sourceUrl || null,
    legalCheckPassed: input.legalCheckPassed,
    legalNotes: input.legalNotes || null,
  }
}

export async function createProductAction(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireAdmin()

  const raw = parseFormData(formData)
  const parsed = productInputSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.')
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message
    }
    return { error: '輸入驗證失敗，請檢查紅色提示', fieldErrors }
  }

  const newFiles = getNewImageFiles(formData)

  let productId: string
  try {
    const fields = normalize(parsed.data)
    const product = await createProduct(fields)
    productId = product.id
    const uploadedPaths = await Promise.all(
      newFiles.map((f) => uploadProductImage(productId, f))
    )
    if (uploadedPaths.length > 0) {
      await setProductImages(productId, uploadedPaths)
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }

  revalidatePath('/admin/products')
  revalidatePath('/shop')
  revalidatePath(`/shop/${parsed.data.slug}`)
  redirect(`/admin/products/${productId}`)
}

export async function updateProductAction(
  productId: string,
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireAdmin()

  const raw = parseFormData(formData)
  const parsed = productInputSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.')
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message
    }
    return { error: '輸入驗證失敗，請檢查紅色提示', fieldErrors }
  }

  const keptPaths = getKeptImagePaths(formData)
  const newFiles = getNewImageFiles(formData)

  try {
    const fields = normalize(parsed.data)
    await updateProduct(productId, fields)

    const uploadedPaths = await Promise.all(
      newFiles.map((f) => uploadProductImage(productId, f))
    )

    // Delete files that the user removed (only Supabase Storage paths,
    // not legacy http URLs).
    const { db } = await import('@/db/client')
    const { productImages } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const existing = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId))

    const removed = existing.filter(
      (img) => !keptPaths.includes(img.cfImageId)
    )
    await Promise.all(removed.map((img) => deleteProductImage(img.cfImageId)))

    await setProductImages(productId, [...keptPaths, ...uploadedPaths])
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }

  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}`)
  revalidatePath('/shop')
  revalidatePath(`/shop/${parsed.data.slug}`)
  return {}
}

export async function archiveProductAction(productId: string) {
  await requireAdmin()
  await archiveProduct(productId)
  revalidatePath('/admin/products')
  revalidatePath('/shop')
  redirect('/admin/products')
}

export type DeleteProductState = { error?: string }

export async function deleteProductAction(
  productId: string,
  _prev: DeleteProductState,
  _formData: FormData
): Promise<DeleteProductState> {
  await requireAdmin()
  try {
    await deleteProduct(productId)
  } catch (e) {
    if (e instanceof ProductHasReferencesError) {
      return {
        error:
          '此商品已被訂單或進貨單引用，無法永久刪除。請改用「封存」隱藏商品。',
      }
    }
    return { error: e instanceof Error ? e.message : String(e) }
  }
  revalidatePath('/admin/products')
  revalidatePath('/shop')
  redirect('/admin/products')
}
