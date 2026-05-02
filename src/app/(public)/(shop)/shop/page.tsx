import Link from 'next/link'
import {
  listActiveProducts,
  listAllCategories,
} from '@/server/services/ProductService'
import { ProductGrid } from '@/components/shop/ProductGrid'

export const metadata = {
  title: '所有選物 | 日系選物店',
  description: '日本母嬰、寵物選物，每週預購批次',
}

interface Props {
  searchParams: Promise<{
    category?: string
    stock?: string
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
    }),
    listAllCategories(),
  ])

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <header className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl">所有選物</h1>
        <p className="text-ink-soft mt-2 text-sm">
          目前共 {items.length} 件商品 · 預購制，每週日截單
        </p>
      </header>

      <div className="mb-10 flex flex-wrap items-center gap-2 pb-4 border-b border-line">
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
          label="預購"
        />
        <FilterChip
          href={`/shop?stock=in_stock${params.category ? `&category=${params.category}` : ''}`}
          active={stockType === 'in_stock'}
          label="現貨"
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
