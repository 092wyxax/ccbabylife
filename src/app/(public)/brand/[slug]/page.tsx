import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, asc, desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { brands, products, productImages } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { BRAND_STORIES } from '@/lib/japan-content'

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
  if (!brand) return { title: '品牌不存在' }
  return {
    title: brand.nameZh,
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
        <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">
          BRAND STORY · ブランド物語
        </p>
        <h1 className="font-serif text-4xl mb-2 tracking-wide">{brand.nameZh}</h1>
        {brand.nameJp && (
          <p className="font-jp text-ink-soft text-lg mb-3">{brand.nameJp}</p>
        )}
        {brand.description && (
          <p className="text-ink-soft leading-relaxed max-w-2xl">
            {brand.description}
          </p>
        )}
      </header>

      {(() => {
        const story = BRAND_STORIES[brand.slug]
        if (!story) return null
        return (
          <section className="mb-12 grid lg:grid-cols-[1fr_280px] gap-8 pb-10 border-b border-line">
            <div>
              <p className="font-jp text-xs tracking-[0.3em] text-accent mb-2">
                {story.foundedYear} 年創業
              </p>
              <h2 className="font-serif text-2xl mb-5 tracking-wide leading-snug">
                {story.headline}
              </h2>
              <div className="text-ink/90 leading-relaxed space-y-4">
                {story.story.split(/\n\n+/).map((para, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {para}
                  </p>
                ))}
              </div>
            </div>
            <aside className="bg-cream-100 border border-line rounded-lg p-5 h-fit">
              <p className="font-jp text-xs tracking-[0.2em] text-ink-soft mb-3">
                ファクト · 數據面
              </p>
              <ul className="space-y-2 text-sm">
                {story.facts.map((f, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-accent shrink-0">·</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </section>
        )
      })()}

      <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-6">
        全商品 · 全 {items.length} 點
      </p>

      <ProductGrid products={items} />
    </div>
  )
}
