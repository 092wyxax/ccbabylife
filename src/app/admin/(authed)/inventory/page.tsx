import Link from 'next/link'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { products, brands } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { formatTwd } from '@/lib/format'
import { StockAdjustForm } from '@/components/admin/StockAdjustForm'

const LOW_STOCK_THRESHOLD = 3

export default async function AdminInventoryPage() {
  const rows = await db
    .select({ product: products, brand: brands })
    .from(products)
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(
      and(
        eq(products.orgId, DEFAULT_ORG_ID),
        eq(products.stockType, 'in_stock')
      )
    )
    .orderBy(asc(products.stockQuantity), asc(products.nameZh))

  const lowStock = rows.filter((r) => r.product.stockQuantity <= LOW_STOCK_THRESHOLD)
  const total = rows.length

  return (
    <div className="p-8 max-w-7xl">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl mb-1">庫存管理</h1>
          <p className="text-ink-soft text-sm">
            現貨商品共 {total} 件 · 低於 {LOW_STOCK_THRESHOLD} 件視為低庫存
          </p>
        </div>
        <Link
          href="/admin/inventory/picklist"
          className="border border-line px-4 py-2 rounded-md text-sm hover:border-ink transition-colors"
        >
          產生揀貨單
        </Link>
      </header>

      {total === 0 ? (
        <div className="bg-white border border-line rounded-lg p-12 text-center">
          <p className="text-ink-soft mb-2">目前沒有現貨商品。</p>
          <p className="text-xs text-ink-soft">
            到{' '}
            <Link href="/admin/products" className="underline hover:text-accent">
              商品管理
            </Link>{' '}
            把商品的「商品類型」改為「現貨」。
          </p>
        </div>
      ) : (
        <>
          {lowStock.length > 0 && (
            <div className="bg-warning/15 border border-warning/40 rounded-lg p-4 mb-6">
              <p className="font-medium text-sm mb-2">
                ⚠ {lowStock.length} 件商品低於警戒線
              </p>
              <ul className="text-xs text-ink-soft space-y-0.5">
                {lowStock.map((r) => (
                  <li key={r.product.id}>
                    {r.product.nameZh} — 剩 {r.product.stockQuantity} 件
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white border border-line rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 text-ink-soft">
                <tr>
                  <th className="text-left px-4 py-3 font-normal">商品</th>
                  <th className="text-left px-4 py-3 font-normal">品牌</th>
                  <th className="text-right px-4 py-3 font-normal">售價</th>
                  <th className="text-left px-4 py-3 font-normal w-48">目前庫存</th>
                  <th className="text-left px-4 py-3 font-normal">狀態</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ product, brand }) => {
                  const isLow = product.stockQuantity <= LOW_STOCK_THRESHOLD
                  const isOut = product.stockQuantity <= 0
                  return (
                    <tr key={product.id} className="border-t border-line hover:bg-cream-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="hover:text-accent"
                        >
                          {product.nameZh}
                        </Link>
                        <p className="text-xs text-ink-soft mt-0.5">{product.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{brand?.nameZh ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        {formatTwd(product.priceTwd)}
                      </td>
                      <td className="px-4 py-3">
                        <StockAdjustForm
                          productId={product.id}
                          currentQuantity={product.stockQuantity}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {isOut ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-danger/15 text-danger">
                            售完
                          </span>
                        ) : isLow ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-warning/20 text-ink">
                            低庫存
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-ink">
                            正常
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="mt-6 p-4 bg-cream-100 border border-line rounded-lg text-xs text-ink-soft leading-relaxed">
        <p className="font-medium text-ink mb-1">後續可加</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>盤點作業（差異報表 + audit log）</li>
          <li>每件商品自訂的低庫存閾值（目前是全站固定 {LOW_STOCK_THRESHOLD}）</li>
          <li>低庫存自動 LINE 推播給先生</li>
          <li>揀貨單列印（依今日待出貨訂單聚合）</li>
        </ul>
      </div>
    </div>
  )
}
