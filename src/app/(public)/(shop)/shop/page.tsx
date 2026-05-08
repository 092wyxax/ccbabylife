import Link from 'next/link'
import {
  listActiveProducts,
  listAllCategories,
} from '@/server/services/ProductService'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { MobileFilterSheet } from '@/components/shop/MobileFilterSheet'

export const metadata = {
  title: '所有選物',
  description: '日本母嬰、寵物選物，每週預購批次',
}

interface Props {
  searchParams: Promise<{
    category?: string
    stock?: string
    q?: string
  }>
}

export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams
  const stockType =
    params.stock === 'preorder' || params.stock === 'in_stock'
      ? params.stock
      : undefined

  const [items, categories] = await Promise.all([
    listActiveProducts({
      limit: 60,
      categorySlug: params.category,
      stockType,
      q: params.q,
    }),
    listAllCategories(),
  ])

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
          現在 <span className="font-jp">{items.length} 點</span>
          {!params.q && ' · 予約制 · 毎週日 23:59 締切'}
        </p>
      </header>

      <form action="/shop" method="get" className="mb-6">
        {params.category && <input type="hidden" name="category" value={params.category} />}
        {stockType && <input type="hidden" name="stock" value={stockType} />}
        <div className="relative max-w-md">
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ''}
            placeholder="搜尋商品、品牌、關鍵字…"
            className="w-full pl-10 pr-3 py-2.5 border border-line rounded-md focus:outline-none focus:border-ink text-sm bg-white"
          />
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          {params.q && (
            <Link
              href={`/shop${params.category ? `?category=${params.category}` : ''}${stockType ? `${params.category ? '&' : '?'}stock=${stockType}` : ''}`}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink-soft hover:text-ink px-2 py-1 rounded"
              aria-label="清除搜尋"
            >
              ✕
            </Link>
          )}
        </div>
      </form>

      <div className="mb-6 lg:hidden">
        <MobileFilterSheet
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
          activeCategory={params.category}
          activeStock={stockType}
          searchQuery={params.q}
        />
      </div>

      <div className="mb-10 hidden lg:flex flex-wrap items-center gap-2 pb-4 border-b border-line">
        <FilterChip href="/shop" active={!params.category} label="全部分類" />
        {categories.map((c) => (
          <FilterChip
            key={c.id}
            href={`/shop?category=${c.slug}${stockType ? `&stock=${stockType}` : ''}`}
            active={params.category === c.slug}
            label={c.name}
          />
        ))}

        <span className="mx-2 h-4 w-px bg-line" />

        <FilterChip
          href={`/shop${params.category ? `?category=${params.category}` : ''}`}
          active={!stockType}
          label="全部"
        />
        <FilterChip
          href={`/shop?stock=preorder${params.category ? `&category=${params.category}` : ''}`}
          active={stockType === 'preorder'}
          label="予約 · 預購"
        />
        <FilterChip
          href={`/shop?stock=in_stock${params.category ? `&category=${params.category}` : ''}`}
          active={stockType === 'in_stock'}
          label="在庫 · 現貨"
        />
      </div>

      <ProductGrid products={items} />
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
