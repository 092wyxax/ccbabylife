import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { brands, productStockTypeEnum, productStatusEnum } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { listProductsForAdmin } from '@/server/services/ProductService'
import { formatTwd, formatJpy } from '@/lib/format'
import { parsePage } from '@/lib/pagination'
import { Pagination, SearchBox } from '@/components/admin/Pagination'
import { ProductBulkBar } from '@/components/admin/ProductBulkBar'

interface Props {
  searchParams: Promise<{
    q?: string
    status?: string
    stockType?: string
    brand?: string
    page?: string
  }>
}

export default async function AdminProductsPage({ searchParams }: Props) {
  const params = await searchParams
  const status =
    params.status && (productStatusEnum as readonly string[]).includes(params.status)
      ? (params.status as 'draft' | 'active' | 'archived')
      : undefined
  const stockType =
    params.stockType && (productStockTypeEnum as readonly string[]).includes(params.stockType)
      ? (params.stockType as 'preorder' | 'in_stock')
      : undefined

  const [result, allBrands] = await Promise.all([
    listProductsForAdmin({
      search: params.q,
      status,
      stockType,
      brandId: params.brand,
      page: parsePage(params.page),
    }),
    db.select().from(brands).where(eq(brands.orgId, DEFAULT_ORG_ID)),
  ])

  const buildHref = (p: number) => {
    const usp = new URLSearchParams()
    if (params.q) usp.set('q', params.q)
    if (params.status) usp.set('status', params.status)
    if (params.stockType) usp.set('stockType', params.stockType)
    if (params.brand) usp.set('brand', params.brand)
    if (p > 1) usp.set('page', String(p))
    const qs = usp.toString()
    return qs ? `/admin/products?${qs}` : '/admin/products'
  }

  return (
    <div className="p-8 max-w-7xl">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl mb-1">商品管理</h1>
          <p className="text-ink-soft text-sm">共 {result.total} 件</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products/import"
            className="border border-line px-4 py-2 rounded-md text-sm hover:border-ink transition-colors"
          >
            CSV 匯入
          </Link>
          <Link
            href="/admin/products/new"
            className="bg-ink text-cream px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors"
          >
            + 新增商品
          </Link>
        </div>
      </header>

      <SearchBox
        defaultValue={params.q}
        placeholder="中文 / 日文品名 / slug"
        hiddenFields={{
          status: params.status,
          stockType: params.stockType,
          brand: params.brand,
        }}
      />

      <div className="bg-white border border-line rounded-lg p-3 mb-4 flex flex-wrap items-center gap-2 text-xs">
        <FilterPill name="status" value={undefined} current={params.status} label="全部狀態" qparams={params} />
        <FilterPill name="status" value="active" current={params.status} label="上架中" qparams={params} />
        <FilterPill name="status" value="draft" current={params.status} label="草稿" qparams={params} />
        <FilterPill name="status" value="archived" current={params.status} label="已封存" qparams={params} />

        <span className="mx-1 h-3 w-px bg-line" />

        <FilterPill name="stockType" value={undefined} current={params.stockType} label="全部類型" qparams={params} />
        <FilterPill name="stockType" value="preorder" current={params.stockType} label="預購" qparams={params} />
        <FilterPill name="stockType" value="in_stock" current={params.stockType} label="現貨" qparams={params} />

        <span className="mx-1 h-3 w-px bg-line" />

        <form className="flex items-center gap-2 ml-auto">
          {params.q && <input type="hidden" name="q" value={params.q} />}
          {params.status && <input type="hidden" name="status" value={params.status} />}
          {params.stockType && <input type="hidden" name="stockType" value={params.stockType} />}
          <select
            name="brand"
            defaultValue={params.brand ?? ''}
            className="text-xs border border-line rounded-md px-2 py-1 bg-white"
          >
            <option value="">全部品牌</option>
            {allBrands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nameZh}
              </option>
            ))}
          </select>
          <button type="submit" className="text-xs bg-ink text-cream px-2 py-1 rounded-md">
            套用
          </button>
        </form>
      </div>

      {result.rows.length === 0 ? (
        <div className="bg-white border border-line rounded-lg p-12 text-center text-ink-soft">
          沒有符合條件的商品
        </div>
      ) : (
        <>
          <ProductBulkBar productIds={result.rows.map((r) => r.product.id)} />
          <div className="bg-white border border-line rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 text-ink-soft">
                <tr>
                  <th className="px-2 py-3 w-8"></th>
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
                {result.rows.map(({ product, brand }) => (
                  <tr key={product.id} className="border-t border-line hover:bg-cream-50">
                    <td className="px-2 py-3 text-center">
                      <input
                        type="checkbox"
                        name="bulk-product-id"
                        value={product.id}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/products/${product.id}`} className="hover:text-accent">
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
                        {product.stockType === 'preorder'
                          ? '預購'
                          : `現貨 ${product.stockQuantity}`}
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

          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            href={buildHref}
          />
        </>
      )}
    </div>
  )
}

function FilterPill({
  name,
  value,
  current,
  label,
  qparams,
}: {
  name: string
  value: string | undefined
  current: string | undefined
  label: string
  qparams: { q?: string; status?: string; stockType?: string; brand?: string }
}) {
  const active = value ? current === value : !current
  const usp = new URLSearchParams()
  if (qparams.q) usp.set('q', qparams.q)
  if (name !== 'status' && qparams.status) usp.set('status', qparams.status)
  if (name !== 'stockType' && qparams.stockType) usp.set('stockType', qparams.stockType)
  if (qparams.brand) usp.set('brand', qparams.brand)
  if (value) usp.set(name, value)
  const qs = usp.toString()
  const href = qs ? `/admin/products?${qs}` : '/admin/products'

  return (
    <Link
      href={href}
      className={
        'px-3 py-1 rounded-full border transition-colors ' +
        (active
          ? 'bg-ink text-cream border-ink'
          : 'border-line text-ink-soft hover:border-ink hover:text-ink')
      }
    >
      {label}
    </Link>
  )
}
