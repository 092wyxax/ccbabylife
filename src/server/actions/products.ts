'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/server/services/AdminAuthService'
import {
  createProduct,
  updateProduct,
  archiveProduct,
  setProductImages,
} from '@/server/services/ProductService'
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
  imageUrls: z.string().optional().or(z.literal('')),
})

function parseImageUrls(input: string | undefined): string[] {
  if (!input) return []
  return input
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

export type ProductFormState = {
  error?: string
  fieldErrors?: Record<string, string>
}

function parseFormData(formData: FormData) {
  const obj = Object.fromEntries(formData.entries()) as Record<string, string>
  // checkbox: present means true, missing means false
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

  let productId: string
  try {
    const fields = normalize(parsed.data)
    const product = await createProduct(fields)
    productId = product.id
    const urls = parseImageUrls(parsed.data.imageUrls)
    if (urls.length > 0) {
      await setProductImages(productId, urls)
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }

  revalidatePath('/admin/products')
  revalidatePath('/shop')
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

  try {
    const fields = normalize(parsed.data)
    await updateProduct(productId, fields)
    const urls = parseImageUrls(parsed.data.imageUrls)
    await setProductImages(productId, urls)
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }

  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}`)
  revalidatePath('/shop')
  return {}
}

export async function archiveProductAction(productId: string) {
  await requireAdmin()
  await archiveProduct(productId)
  revalidatePath('/admin/products')
  revalidatePath('/shop')
  redirect('/admin/products')
}
