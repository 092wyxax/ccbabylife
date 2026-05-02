'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { products, productVariants } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireAdmin } from '@/server/services/AdminAuthService'
import { recordAudit } from '@/server/services/AuditService'

export type VariantActionState = { error?: string; success?: string }

const addSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string().min(1, '請填 SKU'),
  name: z.string().min(1, '請填規格名稱'),
  priceTwdOverride: z.coerce.number().int().nonnegative().optional(),
  stockQuantity: z.coerce.number().int().nonnegative().default(0),
})

export async function addVariantAction(
  productId: string,
  _prev: VariantActionState,
  formData: FormData
): Promise<VariantActionState> {
  const me = await requireAdmin()
  const parsed = addSchema.safeParse({
    productId,
    sku: formData.get('sku'),
    name: formData.get('name'),
    priceTwdOverride: formData.get('priceTwdOverride') || undefined,
    stockQuantity: formData.get('stockQuantity') || 0,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  }

  // Verify product exists in same org
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.orgId, DEFAULT_ORG_ID)))
    .limit(1)
  if (!product) return { error: '找不到商品' }

  await db.insert(productVariants).values({
    orgId: DEFAULT_ORG_ID,
    productId,
    sku: parsed.data.sku,
    name: parsed.data.name,
    priceTwdOverride: parsed.data.priceTwdOverride ?? null,
    stockQuantity: parsed.data.stockQuantity,
  })

  await recordAudit({
    actorType: 'admin',
    actorId: me.id,
    actorLabel: me.name,
    action: 'product_variant.add',
    entityType: 'product',
    entityId: productId,
    data: { sku: parsed.data.sku, name: parsed.data.name },
  })

  revalidatePath(`/admin/products/${productId}`)
  revalidatePath(`/shop/${product.slug}`)
  return { success: '已新增規格' }
}

export async function removeVariantFormAction(formData: FormData): Promise<void> {
  const me = await requireAdmin()
  const variantId = String(formData.get('variantId') ?? '')
  const productId = String(formData.get('productId') ?? '')
  if (!variantId || !productId) return

  await db
    .delete(productVariants)
    .where(
      and(
        eq(productVariants.id, variantId),
        eq(productVariants.orgId, DEFAULT_ORG_ID)
      )
    )

  await recordAudit({
    actorType: 'admin',
    actorId: me.id,
    actorLabel: me.name,
    action: 'product_variant.remove',
    entityType: 'product',
    entityId: productId,
    data: { variantId },
  })

  revalidatePath(`/admin/products/${productId}`)
}
