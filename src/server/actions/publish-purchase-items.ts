'use server'

import { revalidatePath } from 'next/cache'
import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { purchaseItems, purchases } from '@/db/schema/purchases'
import { products, categories } from '@/db/schema'
import { sources } from '@/db/schema/sources'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireRole } from '@/server/services/AdminAuthService'

interface PublishContext {
  itemId: string
  itemNameZh: string | null
  itemNameJp: string | null
  itemSpec: string | null
  itemDescription: string | null
  itemQuantity: number
  itemUnitJpy: number
  itemSuggestedPrice: number | null
  itemCategoryId: string | null
  itemProductId: string | null
  purchaseId: string
  purchaseDate: string | null
  sourceCode: string | null
  categoryCode: string | null
}

async function loadContext(purchaseItemId: string): Promise<PublishContext | null> {
  const [row] = await db
    .select({
      itemId: purchaseItems.id,
      itemNameZh: purchaseItems.nameZh,
      itemNameJp: purchaseItems.nameJp,
      itemSpec: purchaseItems.spec,
      itemDescription: purchaseItems.description,
      itemQuantity: purchaseItems.quantity,
      itemUnitJpy: purchaseItems.unitJpy,
      itemSuggestedPrice: purchaseItems.suggestedPrice,
      itemCategoryId: purchaseItems.categoryId,
      itemProductId: purchaseItems.productId,
      purchaseId: purchases.id,
      purchaseDate: purchases.purchaseDate,
      sourceCode: sources.code,
      categoryCode: categories.code,
    })
    .from(purchaseItems)
    .leftJoin(purchases, eq(purchases.id, purchaseItems.purchaseId))
    .leftJoin(sources, eq(sources.id, purchases.sourceId))
    .leftJoin(categories, eq(categories.id, purchaseItems.categoryId))
    .where(
      and(
        eq(purchaseItems.orgId, DEFAULT_ORG_ID),
        eq(purchaseItems.id, purchaseItemId)
      )
    )
    .limit(1)
  if (!row || !row.purchaseId) return null
  return row as PublishContext
}

function buildSkuPrefix(ctx: PublishContext): string {
  const sourceCode = (ctx.sourceCode ?? 'XX').toUpperCase()
  const categoryCode = (ctx.categoryCode ?? 'X').toUpperCase()
  const date = ctx.purchaseDate ?? new Date().toISOString().slice(0, 10)
  const yy = date.slice(2, 4)
  const mm = date.slice(5, 7)
  return `${sourceCode}${yy}${mm}${categoryCode}`
}

async function nextSku(prefix: string): Promise<string> {
  const lower = prefix.toLowerCase()
  const matches = await db
    .select({ slug: products.slug })
    .from(products)
    .where(
      and(
        eq(products.orgId, DEFAULT_ORG_ID),
        sql`${products.slug} ILIKE ${lower + '%'}`
      )
    )
    .orderBy(desc(products.slug))
    .limit(1)

  let next = 1
  if (matches[0]) {
    const m = matches[0].slug.match(/(\d{4})$/)
    if (m) next = parseInt(m[1], 10) + 1
  }
  return `${prefix}${String(next).padStart(4, '0')}`
}

async function publishOne(ctx: PublishContext): Promise<{
  ok: boolean
  reason?: string
  productId?: string
  sku?: string
}> {
  if (ctx.itemProductId) {
    return { ok: false, reason: '此品項已經上架過了' }
  }
  if (!ctx.itemNameZh || !ctx.itemNameZh.trim()) {
    return { ok: false, reason: '中文品名為空，無法上架' }
  }

  const prefix = buildSkuPrefix(ctx)
  const sku = await nextSku(prefix)

  const [created] = await db
    .insert(products)
    .values({
      orgId: DEFAULT_ORG_ID,
      slug: sku.toLowerCase(),
      nameZh: ctx.itemNameZh,
      nameJp: ctx.itemNameJp,
      categoryId: ctx.itemCategoryId,
      description: ctx.itemDescription || ctx.itemSpec || '',
      priceJpy: ctx.itemUnitJpy,
      priceTwd: ctx.itemSuggestedPrice ?? 0,
      costJpy: ctx.itemUnitJpy,
      weightG: 0,
      stockType: 'in_stock',
      stockQuantity: ctx.itemQuantity,
      status: 'draft',
    })
    .returning()

  await db
    .update(purchaseItems)
    .set({ productId: created.id })
    .where(eq(purchaseItems.id, ctx.itemId))

  return { ok: true, productId: created.id, sku }
}

export async function publishPurchaseItemAction(purchaseItemId: string) {
  await requireRole(['owner', 'manager', 'buyer'])
  const ctx = await loadContext(purchaseItemId)
  if (!ctx) return

  await publishOne(ctx)

  revalidatePath(`/admin/purchases/${ctx.purchaseId}`)
  revalidatePath('/admin/products')
}

export type PublishAllResult = {
  total: number
  published: number
  skipped: number
  failed: number
  details: Array<{ itemId: string; ok: boolean; sku?: string; reason?: string }>
}

export async function publishAllPurchaseItemsAction(
  purchaseId: string
): Promise<PublishAllResult> {
  await requireRole(['owner', 'manager', 'buyer'])

  const itemIds = await db
    .select({ id: purchaseItems.id })
    .from(purchaseItems)
    .where(
      and(
        eq(purchaseItems.orgId, DEFAULT_ORG_ID),
        eq(purchaseItems.purchaseId, purchaseId)
      )
    )

  const result: PublishAllResult = {
    total: itemIds.length,
    published: 0,
    skipped: 0,
    failed: 0,
    details: [],
  }

  for (const { id } of itemIds) {
    const ctx = await loadContext(id)
    if (!ctx) {
      result.failed++
      result.details.push({ itemId: id, ok: false, reason: '查無資料' })
      continue
    }
    const r = await publishOne(ctx)
    if (r.ok) {
      result.published++
      result.details.push({ itemId: id, ok: true, sku: r.sku })
    } else {
      result.skipped++
      result.details.push({ itemId: id, ok: false, reason: r.reason })
    }
  }

  revalidatePath(`/admin/purchases/${purchaseId}`)
  revalidatePath('/admin/products')
  return result
}
