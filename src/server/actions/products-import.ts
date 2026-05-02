'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { products, brands, categories } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireAdmin } from '@/server/services/AdminAuthService'
import { recordAudit } from '@/server/services/AuditService'
import { parseCSV } from '@/lib/csv'

const REQUIRED_HEADERS = [
  'slug',
  'nameZh',
  'priceJpy',
  'priceTwd',
  'weightG',
  'stockType',
] as const

export type ImportRowResult = {
  rowIndex: number
  slug: string
  status: 'created' | 'updated' | 'skipped' | 'error'
  message?: string
}

export type ImportState = {
  error?: string
  results?: ImportRowResult[]
  total?: number
}

const rowSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  nameZh: z.string().min(1),
  nameJp: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  useExperience: z.string().optional(),
  minAgeMonths: z.coerce.number().int().min(0).max(240).optional(),
  maxAgeMonths: z.coerce.number().int().min(0).max(240).optional(),
  priceJpy: z.coerce.number().int().nonnegative(),
  priceTwd: z.coerce.number().int().nonnegative(),
  costJpy: z.coerce.number().int().nonnegative().optional(),
  weightG: z.coerce.number().int().positive(),
  stockType: z.enum(['preorder', 'in_stock']),
  stockQuantity: z.coerce.number().int().nonnegative().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  legalCheckPassed: z.string().optional(),
  legalNotes: z.string().optional(),
})

function blankToUndef(s: string | undefined): string | undefined {
  if (s == null) return undefined
  const t = s.trim()
  return t.length === 0 ? undefined : t
}

export async function importProductsCsvAction(
  _prev: ImportState,
  formData: FormData
): Promise<ImportState> {
  const me = await requireAdmin()

  const file = formData.get('csv')
  if (!(file instanceof File) || file.size === 0) {
    return { error: '請選擇 CSV 檔案' }
  }

  const text = await file.text()
  const rows = parseCSV(text)
  if (rows.length < 2) {
    return { error: 'CSV 內容不足（缺 header 或資料）' }
  }

  const headers = rows[0].map((h) => h.trim())
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h))
  if (missing.length > 0) {
    return { error: `CSV 缺少欄位：${missing.join(', ')}` }
  }

  // Pre-fetch brand + category for slug resolution
  const [allBrands, allCategories] = await Promise.all([
    db.select().from(brands).where(eq(brands.orgId, DEFAULT_ORG_ID)),
    db.select().from(categories).where(eq(categories.orgId, DEFAULT_ORG_ID)),
  ])
  const brandBySlug = new Map(allBrands.map((b) => [b.slug, b.id]))
  const brandByName = new Map(allBrands.map((b) => [b.nameZh, b.id]))
  const categoryBySlug = new Map(allCategories.map((c) => [c.slug, c.id]))
  const categoryByName = new Map(allCategories.map((c) => [c.name, c.id]))

  const results: ImportRowResult[] = []

  for (let i = 1; i < rows.length; i++) {
    const raw: Record<string, string | undefined> = {}
    headers.forEach((h, idx) => {
      raw[h] = blankToUndef(rows[i][idx])
    })

    const parsed = rowSchema.safeParse(raw)
    if (!parsed.success) {
      results.push({
        rowIndex: i + 1,
        slug: raw.slug ?? '',
        status: 'error',
        message: parsed.error.issues[0]?.message ?? '欄位驗證錯誤',
      })
      continue
    }

    const data = parsed.data
    const brandId = data.brand
      ? brandBySlug.get(data.brand) ?? brandByName.get(data.brand) ?? null
      : null
    const categoryId = data.category
      ? categoryBySlug.get(data.category) ?? categoryByName.get(data.category) ?? null
      : null
    const legalCheckPassed =
      data.legalCheckPassed != null &&
      ['true', 'yes', '1', '是'].includes(data.legalCheckPassed.toLowerCase())

    const fields = {
      slug: data.slug,
      nameZh: data.nameZh,
      nameJp: data.nameJp ?? null,
      brandId,
      categoryId,
      description: data.description ?? null,
      useExperience: data.useExperience ?? null,
      minAgeMonths: data.minAgeMonths ?? null,
      maxAgeMonths: data.maxAgeMonths ?? null,
      priceJpy: data.priceJpy,
      priceTwd: data.priceTwd,
      costJpy: data.costJpy ?? null,
      weightG: data.weightG,
      stockType: data.stockType,
      stockQuantity: data.stockQuantity ?? 0,
      status: data.status ?? 'draft',
      legalCheckPassed,
      legalNotes: data.legalNotes ?? null,
    }

    try {
      const existing = await db
        .select({ id: products.id })
        .from(products)
        .where(
          and(eq(products.orgId, DEFAULT_ORG_ID), eq(products.slug, data.slug))
        )
        .limit(1)

      if (existing[0]) {
        await db
          .update(products)
          .set({ ...fields, updatedAt: new Date() })
          .where(eq(products.id, existing[0].id))
        results.push({ rowIndex: i + 1, slug: data.slug, status: 'updated' })
      } else {
        await db.insert(products).values({
          ...fields,
          orgId: DEFAULT_ORG_ID,
        })
        results.push({ rowIndex: i + 1, slug: data.slug, status: 'created' })
      }
    } catch (e) {
      results.push({
        rowIndex: i + 1,
        slug: data.slug,
        status: 'error',
        message: e instanceof Error ? e.message : String(e),
      })
    }
  }

  await recordAudit({
    actorType: 'admin',
    actorId: me.id,
    actorLabel: me.name,
    action: 'product.csv_import',
    entityType: 'product',
    entityId: null,
    data: {
      total: results.length,
      created: results.filter((r) => r.status === 'created').length,
      updated: results.filter((r) => r.status === 'updated').length,
      errors: results.filter((r) => r.status === 'error').length,
    },
  })

  revalidatePath('/admin/products')
  revalidatePath('/shop')

  return { total: results.length, results }
}
