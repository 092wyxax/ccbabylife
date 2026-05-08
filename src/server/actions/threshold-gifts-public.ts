'use server'

import { listActiveThresholdGifts } from '@/server/services/PromotionService'
import { db } from '@/db/client'
import { products } from '@/db/schema/products'
import { inArray } from 'drizzle-orm'

export interface PublicGift {
  id: string
  name: string
  thresholdTwd: number
  giftProductName: string
  quantity: number
}

export async function fetchActiveGiftsAction(): Promise<PublicGift[]> {
  const gifts = await listActiveThresholdGifts()
  if (gifts.length === 0) return []
  const ids = Array.from(new Set(gifts.map((g) => g.giftProductId)))
  const productRows = await db
    .select({ id: products.id, nameZh: products.nameZh, status: products.status })
    .from(products)
    .where(inArray(products.id, ids))
  const byId = new Map(productRows.map((p) => [p.id, p]))

  return gifts
    .filter((g) => byId.get(g.giftProductId)?.status === 'active')
    .map((g) => ({
      id: g.id,
      name: g.name,
      thresholdTwd: g.thresholdTwd,
      giftProductName: byId.get(g.giftProductId)?.nameZh ?? '',
      quantity: g.quantity,
    }))
}
