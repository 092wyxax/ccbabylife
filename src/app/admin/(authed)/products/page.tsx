import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { products, brands } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { formatTwd, formatJpy } from '@/lib/format'

export default async function AdminProductsPage() {
  const rows = await db
    .select({
      product: products,
      brand: brands,
    })
    .from(products)
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(eq(products.orgId, DEFAULT_ORG_ID))
    .orderBy(desc(products.createdAt))

  return (
    <div className="p-8 max-w-7xl">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl mb-1">商品管理</h1>
          <p className="text-ink-soft text-sm">共 {rows.length} 件</p>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-ink text-cream px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors"
        >
          + 新增商品
        </Link>
      </header>

      <div className="bg-white border border-line rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream-100 text-ink-soft">
            <tr>
              <th className="text-left px-4 py-3 font-normal">品名</th>
              <th className="text-left px-4 py-3 font-normal">品牌</th>
              <th className="text-right px-4 py-3 font-normal">日幣成本</th>
              <th className="text-right px-4 py-3 font-normal">售價</th>
              <th className="text-left px-4 py-3 font-normal">類型</th>
              <th className="text-left px-4 py-3 font-normal">狀態</th>
              <th className="text-right px-4 py-3 font-normal">銷售</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ product, brand }) => (
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
                <td className="px-4 py-3 text-right text-ink-soft">
                  {product.costJpy ? formatJpy(product.costJpy) : '—'}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatTwd(product.priceTwd)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      'text-xs px-2 py-0.5 rounded-full ' +
                      (product.stockType === 'preorder'
                        ? 'bg-warning/20'
                        : 'bg-success/20')
                    }
                  >
                    {product.stockType === 'preorder' ? '預購' : `現貨 ${product.stockQuantity}`}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      'text-xs px-2 py-0.5 rounded-full ' +
                      (product.status === 'active'
                        ? 'bg-success/20'
                        : product.status === 'draft'
                        ? 'bg-line'
                        : 'bg-ink/10 text-ink-soft')
                    }
                  >
                    {product.status === 'active'
                      ? '上架中'
                      : product.status === 'draft'
                      ? '草稿'
                      : '已封存'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-ink-soft">{product.salesCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
