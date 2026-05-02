import Link from 'next/link'
import { and, desc, eq, type SQL } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  products,
  brands,
  type Product,
  type Brand,
  productStockTypeEnum,
  productStatusEnum,
} from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { formatTwd, formatJpy } from '@/lib/format'

interface Props {
  searchParams: Promise<{
    status?: string
    stockType?: string
    brand?: string
  }>
}

export default async function AdminProductsPage({ searchParams }: Props) {
  const params = await searchParams

  const conditions: SQL[] = [eq(products.orgId, DEFAULT_ORG_ID)]
  if (params.status && (productStatusEnum as readonly string[]).includes(params.status)) {
    conditions.push(eq(products.status, params.status as Product['status']))
  }
  if (params.stockType && (productStockTypeEnum as readonly string[]).includes(params.stockType)) {
    conditions.push(eq(products.stockType, params.stockType as Product['stockType']))
  }
  if (params.brand) {
    conditions.push(eq(products.brandId, params.brand))
  }

  const [rows, allBrands] = await Promise.all([
    db
      .select({ product: products, brand: brands })
      .from(products)
      .leftJoin(brands, eq(brands.id, products.brandId))
      .where(and(...conditions))
      .orderBy(desc(products.createdAt)),
    db.select().from(brands).where(eq(brands.orgId, DEFAULT_ORG_ID)),
  ])

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

      <Filters params={params} brands={allBrands} />

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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-ink-soft">
                  沒有符合條件的商品
                </td>
              </tr>
            ) : (
              rows.map(({ product, brand }) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Filters({ params, brands }: { params: Awaited<Props['searchParams']>; brands: Brand[] }) {
  const hasFilter = params.status || params.stockType || params.brand
  return (
    <div className="bg-white border border-line rounded-lg p-4 mb-4 flex flex-wrap items-center gap-2">
      <FilterPill name="status" value={undefined} current={params.status} label="全部狀態" />
      <FilterPill name="status" value="active" current={params.status} label="上架中" />
      <FilterPill name="status" value="draft" current={params.status} label="草稿" />
      <FilterPill name="status" value="archived" current={params.status} label="已封存" />

      <span className="mx-2 h-4 w-px bg-line" />

      <FilterPill name="stockType" value={undefined} current={params.stockType} label="全部類型" />
      <FilterPill name="stockType" value="preorder" current={params.stockType} label="預購" />
      <FilterPill name="stockType" value="in_stock" current={params.stockType} label="現貨" />

      <span className="mx-2 h-4 w-px bg-line" />

      <form className="flex items-center gap-2 ml-auto">
        {/* preserve other params */}
        {params.status && <input type="hidden" name="status" value={params.status} />}
        {params.stockType && <input type="hidden" name="stockType" value={params.stockType} />}
        <select
          name="brand"
          defaultValue={params.brand ?? ''}
          className="text-sm border border-line rounded-md px-2 py-1 bg-white"
        >
          <option value="">全部品牌</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.nameZh}</option>
          ))}
        </select>
        <button type="submit" className="text-sm bg-ink text-cream px-3 py-1 rounded-md">
          套用
        </button>
      </form>

      {hasFilter && (
        <Link href="/admin/products" className="text-xs text-ink-soft hover:text-danger underline ml-2">
          清除篩選
        </Link>
      )}
    </div>
  )
}

function FilterPill({
  name,
  value,
  current,
  label,
}: {
  name: string
  value: string | undefined
  current: string | undefined
  label: string
}) {
  const active = value ? current === value : !current
  const href = value ? `?${name}=${encodeURIComponent(value)}` : '/admin/products'
  return (
    <Link
      href={href}
      className={
        'text-xs px-3 py-1 rounded-full border transition-colors ' +
        (active
          ? 'bg-ink text-cream border-ink'
          : 'border-line text-ink-soft hover:border-ink hover:text-ink')
      }
    >
      {label}
    </Link>
  )
}
