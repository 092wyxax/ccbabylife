'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { products } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireAdmin } from '@/server/services/AdminAuthService'
import { recordAudit } from '@/server/services/AuditService'

export type InventoryActionState = { error?: string; success?: string }

const setSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(0),
  reason: z.string().optional(),
})

export async function setStockAction(
  _prev: InventoryActionState,
  formData: FormData
): Promise<InventoryActionState> {
  const admin = await requireAdmin()
  const parsed = setSchema.safeParse({
    productId: formData.get('productId'),
    quantity: formData.get('quantity'),
    reason: formData.get('reason') ?? undefined,
  })
  if (!parsed.success) return { error: '輸入錯誤' }

  const [product] = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.id, parsed.data.productId),
        eq(products.orgId, DEFAULT_ORG_ID)
      )
    )
    .limit(1)
  if (!product) return { error: '找不到商品' }

  const before = product.stockQuantity
  const after = parsed.data.quantity

  if (before === after) {
    return { success: '庫存未變更' }
  }

  await db
    .update(products)
    .set({ stockQuantity: after, updatedAt: new Date() })
    .where(eq(products.id, parsed.data.productId))

  await recordAudit({
    actorType: 'admin',
    actorId: admin.id,
    actorLabel: admin.name,
    action: 'inventory.set_stock',
    entityType: 'product',
    entityId: product.id,
    data: {
      productName: product.nameZh,
      before,
      after,
      delta: after - before,
      reason: parsed.data.reason ?? null,
    },
  })

  revalidatePath('/admin/inventory')
  revalidatePath('/admin/products')
  revalidatePath(`/shop/${product.slug}`)
  return { success: `${product.nameZh}：${before} → ${after}` }
}
