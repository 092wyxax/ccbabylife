import Link from 'next/link'
import {
  listActiveProducts,
  listAllCategories,
  type ProductSort,
} from '@/server/services/ProductService'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { MobileFilterSheet } from '@/components/shop/MobileFilterSheet'
import { LiveSearchBar } from '@/components/shop/LiveSearchBar'

export const metadata = {
  title: '所有選物',
  description: '日本母嬰、寵物選物，每週預購批次',
}

const PAGE_SIZE = 24

const SORT_LABEL: Record<ProductSort, string> = {
  popular: '熱賣優先',
  newest: '新上架',
  'price-asc': '價格低到高',
  'price-desc': '價格高到低',
}

interface Props {
  searchParams: Promise<{
    category?: string
    stock?: string
    q?: string
    sort?: string
    age?: string
    pmin?: string
    pmax?: string
    page?: string
  }>
}

export default async function ShopPage({ searchParams }: Props) {
  try {
    return await renderShop(await searchParams)
  } catch (err) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <h1 className="font-serif text-2xl mb-4">商品列表（診斷模式）</h1>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <pre className="text-xs text-red-800 whitespace-pre-wrap break-all leading-relaxed">
{err instanceof Error ? `${err.name}: ${err.message}\n\n${err.stack ?? '(no stack)'}` : String(err)}
          </pre>
        </div>
      </div>
    )
  }
}

async function renderShop(params: Awaited<Props['searchParams']>) {
  const stockType =
    params.stock === 'preorder' || params.stock === 'in_stock'
      ? params.stock
      : undefined
  const sort: ProductSort = (
    ['popular', 'newest', 'price-asc', 'price-desc'] as const
  ).includes(params.sort as ProductSort)
    ? (params.sort as ProductSort)
    : 'popular'
  const ageBucket = (
    ['newborn', '0-6m', '6-12m', '1y+'] as const
  ).includes(params.age as 'newborn' | '0-6m' | '6-12m' | '1y+')
    ? (params.age as 'newborn' | '0-6m' | '6-12m' | '1y+')
    : undefined

  const priceMin = params.pmin ? Number(params.pmin) : undefined
  const priceMax = params.pmax ? Number(params.pmax) : undefined
  const page = Math.max(1, Number(params.page ?? 1))

  const [{ items, total }, categories] = await Promise.all([
    listActiveProducts({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      categorySlug: params.category,
      stockType,
      q: params.q,
      sort,
      ageBucket,
      priceMin,
      priceMax,
    }),
    listAllCategories(),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Helper for building urls with current params
  const buildHref = (overrides: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams()
    const merged = {
      category: params.category,
      stock: stockType,
      q: params.q,
      sort: sort === 'popular' ? undefined : sort,
      age: ageBucket,
      pmin: priceMin,
      pmax: priceMax,
      page: page > 1 ? page : undefined,
      ...overrides,
    }
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== null && v !== '') sp.set(k, String(v))
    }
    const qs = sp.toString()
    return qs ? `/shop?${qs}` : '/shop'
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <header className="mb-8">
        <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">
          SHOP · 全商品一覧
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl tracking-wide">
          {params.q ? `「${params.q}」搜尋結果` : '所有選物'}
        </h1>
        <p className="text-ink-soft mt-2 text-sm">
          共 <span className="font-jp">{total} 件</span>
          {!params.q && ' · 予約制 · 毎週日 23:59 締切'}
        </p>
      </header>

      {/* Live search bar (autocomplete + recent) */}
      <div className="mb-6">
        <LiveSearchBar
          initialQuery={params.q ?? ''}
          buildHrefForQuery={(q) => buildHref({ q: q || undefined, page: undefined })}
        />
      </div>

      {/* Mobile filter trigger */}
      <div className="mb-6 lg:hidden">
        <MobileFilterSheet
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
          activeCategory={params.category}
          activeStock={stockType}
          searchQuery={params.q}
        />
      </div>

      {/* Desktop chip rail */}
      <div className="mb-6 hidden lg:flex flex-wrap items-center gap-2 pb-4 border-b border-line">
        <FilterChip href={buildHref({ category: undefined, page: undefined })} active={!params.category} label="全部分類" />
        {categories.map((c) => (
          <FilterChip
            key={c.id}
            href={buildHref({ category: c.slug, page: undefined })}
            active={params.category === c.slug}
            label={c.name}
          />
        ))}

        <span className="mx-2 h-4 w-px bg-line" />

        <FilterChip
          href={buildHref({ stock: undefined, page: undefined })}
          active={!stockType}
          label="全部"
        />
        <FilterChip
          href={buildHref({ stock: 'preorder', page: undefined })}
          active={stockType === 'preorder'}
          label="予約 · 預購"
        />
        <FilterChip
          href={buildHref({ stock: 'in_stock', page: undefined })}
          active={stockType === 'in_stock'}
          label="在庫 · 現貨"
        />
      </div>

      {/* Age buckets + price + sort row */}
      <div className="hidden lg:flex flex-wrap items-center gap-2 mb-10 text-xs">
        <span className="text-ink-soft pr-2 font-jp tracking-widest">年齡</span>
        <FilterChip href={buildHref({ age: undefined, page: undefined })} active={!ageBucket} label="全部" />
        <FilterChip href={buildHref({ age: 'newborn', page: undefined })} active={ageBucket === 'newborn'} label="新生兒" />
        <FilterChip href={buildHref({ age: '0-6m', page: undefined })} active={ageBucket === '0-6m'} label="0–6 個月" />
        <FilterChip href={buildHref({ age: '6-12m', page: undefined })} active={ageBucket === '6-12m'} label="6–12 個月" />
        <FilterChip href={buildHref({ age: '1y+', page: undefined })} active={ageBucket === '1y+'} label="1 歲以上" />

        <span className="mx-2 h-4 w-px bg-line" />

        <span className="text-ink-soft pr-2 font-jp tracking-widest">價格</span>
        <FilterChip href={buildHref({ pmin: undefined, pmax: undefined, page: undefined })} active={priceMin == null && priceMax == null} label="全部" />
        <FilterChip href={buildHref({ pmin: 0, pmax: 500, page: undefined })} active={priceMin === 0 && priceMax === 500} label="< 500" />
        <FilterChip href={buildHref({ pmin: 500, pmax: 1000, page: undefined })} active={priceMin === 500 && priceMax === 1000} label="500–1k" />
        <FilterChip href={buildHref({ pmin: 1000, pmax: 3000, page: undefined })} active={priceMin === 1000 && priceMax === 3000} label="1k–3k" />
        <FilterChip href={buildHref({ pmin: 3000, pmax: undefined, page: undefined })} active={priceMin === 3000} label="3k 以上" />

        <span className="ml-auto text-ink-soft pr-2 font-jp tracking-widest">排序</span>
        {(Object.keys(SORT_LABEL) as ProductSort[]).map((k) => (
          <FilterChip
            key={k}
            href={buildHref({ sort: k === 'popular' ? undefined : k, page: undefined })}
            active={sort === k}
            label={SORT_LABEL[k]}
          />
        ))}
      </div>

      <ProductGrid products={items} />

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-2 text-sm">
          {page > 1 ? (
            <Link
              href={buildHref({ page: page - 1 })}
              className="px-3 py-2 border border-line rounded-md hover:border-ink"
            >
              ← 上一頁
            </Link>
          ) : (
            <span className="px-3 py-2 border border-line rounded-md text-ink-soft/50 cursor-not-allowed">
              ← 上一頁
            </span>
          )}
          <span className="font-jp text-xs text-ink-soft px-3">
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={buildHref({ page: page + 1 })}
              className="px-3 py-2 border border-line rounded-md hover:border-ink"
            >
              下一頁 →
            </Link>
          ) : (
            <span className="px-3 py-2 border border-line rounded-md text-ink-soft/50 cursor-not-allowed">
              下一頁 →
            </span>
          )}
        </nav>
      )}
    </div>
  )
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string
  active: boolean
  label: string
}) {
  return (
    <Link
      href={href}
      className={
        'text-xs px-3 py-1.5 rounded-full border transition-colors ' +
        (active
          ? 'bg-ink text-cream border-ink'
          : 'border-line text-ink-soft hover:border-ink hover:text-ink')
      }
    >
      {label}
    </Link>
  )
}
