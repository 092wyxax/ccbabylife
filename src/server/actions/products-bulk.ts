'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/db/client'
import { products, productStatusEnum } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireAdmin } from '@/server/services/AdminAuthService'
import { recordAudit } from '@/server/services/AuditService'

const bulkSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  toStatus: z.enum(productStatusEnum),
})

export type BulkActionState = { error?: string; success?: string }

export async function bulkUpdateProductStatusAction(
  _prev: BulkActionState,
  formData: FormData
): Promise<BulkActionState> {
  const me = await requireAdmin()
  const ids = formData.getAll('id').map(String)
  const toStatus = formData.get('toStatus')

  const parsed = bulkSchema.safeParse({ ids, toStatus })
  if (!parsed.success) {
    return { error: '請至少勾選一筆商品並選擇目標狀態' }
  }

  // Guard: prevent bulk-publishing items that haven't passed legal check
  if (parsed.data.toStatus === 'active') {
    const targets = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.orgId, DEFAULT_ORG_ID),
          inArray(products.id, parsed.data.ids)
        )
      )
    const blocked = targets.filter((p) => !p.legalCheckPassed)
    if (blocked.length > 0) {
      return {
        error: `${blocked.length} 件商品尚未通過法規檢核，無法批次上架（請進入個別商品確認）`,
      }
    }
  }

  await db
    .update(products)
    .set({ status: parsed.data.toStatus, updatedAt: new Date() })
    .where(
      and(
        eq(products.orgId, DEFAULT_ORG_ID),
        inArray(products.id, parsed.data.ids)
      )
    )

  await recordAudit({
    actorType: 'admin',
    actorId: me.id,
    actorLabel: me.name,
    action: 'product.bulk_update_status',
    entityType: 'product',
    entityId: null,
    data: { count: parsed.data.ids.length, toStatus: parsed.data.toStatus },
  })

  revalidatePath('/admin/products')
  revalidatePath('/shop')
  return { success: `已更新 ${parsed.data.ids.length} 件商品狀態` }
}
