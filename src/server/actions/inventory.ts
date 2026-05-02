'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { products } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireAdmin } from '@/server/services/AdminAuthService'

const adjustSchema = z.object({
  productId: z.string().uuid(),
  delta: z.coerce.number().int(),
  reason: z.string().optional(),
})

export type InventoryActionState = { error?: string; success?: string }

export async function adjustStockAction(
  _prev: InventoryActionState,
  formData: FormData
): Promise<InventoryActionState> {
  await requireAdmin()
  const parsed = adjustSchema.safeParse({
    productId: formData.get('productId'),
    delta: formData.get('delta'),
    reason: formData.get('reason') ?? undefined,
  })
  if (!parsed.success) return { error: '輸入錯誤' }
  if (parsed.data.delta === 0) return { error: '請填非零的調整量' }

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

  const next = Math.max(0, product.stockQuantity + parsed.data.delta)
  await db
    .update(products)
    .set({ stockQuantity: next, updatedAt: new Date() })
    .where(eq(products.id, parsed.data.productId))

  revalidatePath('/admin/inventory')
  revalidatePath('/admin/products')
  revalidatePath(`/shop/${product.slug}`)
  return { success: `${product.nameZh}：${product.stockQuantity} → ${next}` }
}

const setSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(0),
})

export async function setStockAction(
  _prev: InventoryActionState,
  formData: FormData
): Promise<InventoryActionState> {
  await requireAdmin()
  const parsed = setSchema.safeParse({
    productId: formData.get('productId'),
    quantity: formData.get('quantity'),
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

  await db
    .update(products)
    .set({ stockQuantity: parsed.data.quantity, updatedAt: new Date() })
    .where(eq(products.id, parsed.data.productId))

  revalidatePath('/admin/inventory')
  revalidatePath('/admin/products')
  revalidatePath(`/shop/${product.slug}`)
  return { success: `${product.nameZh}：${product.stockQuantity} → ${parsed.data.quantity}` }
}
