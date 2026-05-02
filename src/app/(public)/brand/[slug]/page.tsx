import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, asc, desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { brands, products, productImages } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { ProductGrid } from '@/components/shop/ProductGrid'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const [brand] = await db
    .select()
    .from(brands)
    .where(and(eq(brands.orgId, DEFAULT_ORG_ID), eq(brands.slug, slug)))
    .limit(1)
  if (!brand) return { title: '品牌不存在 | 日系選物店' }
  return {
    title: `${brand.nameZh} | 日系選物店`,
    description: brand.description ?? `${brand.nameZh} 的所有日系選物`,
  }
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params

  const [brand] = await db
    .select()
    .from(brands)
    .where(and(eq(brands.orgId, DEFAULT_ORG_ID), eq(brands.slug, slug)))
    .limit(1)
  if (!brand) notFound()

  const rows = await db
    .select({ product: products, image: productImages })
    .from(products)
    .leftJoin(
      productImages,
      and(
        eq(productImages.productId, products.id),
        eq(productImages.isPrimary, true)
      )
    )
    .where(
      and(
        eq(products.orgId, DEFAULT_ORG_ID),
        eq(products.brandId, brand.id),
        eq(products.status, 'active')
      )
    )
    .orderBy(desc(products.salesCount), asc(products.nameZh))

  const items = rows.map((r) => ({ product: r.product, primaryImage: r.image }))

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <nav className="text-xs text-ink-soft mb-6">
        <Link href="/" className="hover:text-ink">首頁</Link>
        <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-ink">所有選物</Link>
        <span className="mx-2">/</span>
        <span>{brand.nameZh}</span>
      </nav>

      <header className="mb-10">
        <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">
          Brand
        </p>
        <h1 className="font-serif text-4xl mb-2">{brand.nameZh}</h1>
        {brand.nameJp && (
          <p className="text-ink-soft text-lg mb-3">{brand.nameJp}</p>
        )}
        {brand.description && (
          <p className="text-ink-soft leading-relaxed max-w-2xl">
            {brand.description}
          </p>
        )}
      </header>

      <p className="text-sm text-ink-soft mb-6 pb-4 border-b border-line">
        共 {items.length} 件選物
      </p>

      <ProductGrid products={items} />
    </div>
  )
}
