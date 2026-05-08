import 'server-only'
import { and, eq, lte, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { products, brands, adminUsers } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { multicastText, isLineConfigured } from '@/lib/line-messaging'

export const LOW_STOCK_THRESHOLD = 3

/**
 * Find low-stock in-stock products and push a LINE multicast to all
 * owner / manager / buyer / ops admins who have a lineUserId on file.
 *
 * Idempotent-ish: cron runs daily; if nothing low, no message.
 * If products are persistently low, we re-alert daily until restocked
 * (acceptable for a 5-person store).
 */
export async function alertLowStock(): Promise<{
  matched: number
  recipients: number
  ok: boolean
}> {
  if (!isLineConfigured()) return { matched: 0, recipients: 0, ok: false }

  const rows = await db
    .select({
      id: products.id,
      nameZh: products.nameZh,
      stockQuantity: products.stockQuantity,
      brandName: brands.nameZh,
    })
    .from(products)
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(
      and(
        eq(products.orgId, DEFAULT_ORG_ID),
        eq(products.status, 'active'),
        eq(products.stockType, 'in_stock'),
        lte(products.stockQuantity, LOW_STOCK_THRESHOLD)
      )
    )
    .orderBy(products.stockQuantity)

  if (rows.length === 0) return { matched: 0, recipients: 0, ok: true }

  // Recipients: owners + managers + buyers with LINE bound
  const recipients = await db
    .select({ lineUserId: adminUsers.lineUserId })
    .from(adminUsers)
    .where(
      and(
        eq(adminUsers.status, 'active'),
        // role filter via SQL
        sql`${adminUsers.role} in ('owner','manager','buyer')`
      )
    )

  const ids = recipients
    .map((r) => r.lineUserId)
    .filter((x): x is string => Boolean(x))

  if (ids.length === 0) return { matched: rows.length, recipients: 0, ok: false }

  const top = rows.slice(0, 8)
  const more = rows.length > 8 ? `\n…還有 ${rows.length - 8} 項` : ''

  const lines = top
    .map((r) => `· ${r.brandName ? `[${r.brandName}] ` : ''}${r.nameZh} — ${r.stockQuantity} 件`)
    .join('\n')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ccbabylife.com'
  const text = `📦 低庫存警示（${rows.length} 項）\n\n${lines}${more}\n\n👉 進後台查看：\n${siteUrl}/admin/inventory`

  try {
    // multicast accepts max 500 ids per call — we have far less
    await multicastText(ids, text)
    return { matched: rows.length, recipients: ids.length, ok: true }
  } catch (e) {
    console.error('[LowStockAlert] multicast failed:', e)
    return { matched: rows.length, recipients: ids.length, ok: false }
  }
}
