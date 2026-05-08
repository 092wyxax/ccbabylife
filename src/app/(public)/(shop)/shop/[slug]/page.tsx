import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getProductBySlug,
  listRelatedProducts,
} from '@/server/services/ProductService'
import { listAddonsForMain } from '@/server/services/PromotionService'
import { AddonsSection } from '@/components/shop/AddonsSection'
import { formatTwd, formatJpy, formatAgeRange } from '@/lib/format'
import { imageUrl } from '@/lib/image'
import { AddToCartButton } from '@/components/shop/AddToCartButton'
import { ProductGallery } from '@/components/shop/ProductGallery'
import { StickyMobileCTA } from '@/components/shop/StickyMobileCTA'
import { ProductGrid } from '@/components/shop/ProductGrid'
import {
  RecentlyViewedRecorder,
  RecentlyViewedStrip,
} from '@/components/shop/RecentlyViewed'
import { RestockForm } from '@/components/shop/RestockForm'
import { ReviewForm } from '@/components/shop/ReviewForm'
import {
  listApprovedReviewsForProduct,
  getProductReviewSummary,
} from '@/server/services/ReviewService'
import { getCustomerSession } from '@/lib/customer-session'
import {
  productLd,
  breadcrumbLd,
  jsonLdScript,
} from '@/lib/jsonld'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const detail = await getProductBySlug(slug)
  if (!detail) return { title: '商品不存在' }
  return {
    title: detail.product.nameZh,
    description: detail.product.seoDescription ?? detail.product.description ?? undefined,
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const detail = await getProductBySlug(slug)
  if (!detail) notFound()

  const { product, brand, category, images } = detail
  const ageLabel = formatAgeRange(product.minAgeMonths, product.maxAgeMonths)
  const isPreorder = product.stockType === 'preorder'

  const [reviews, reviewSummary, customerSession, addons, related] = await Promise.all([
    listApprovedReviewsForProduct(product.id),
    getProductReviewSummary(product.id),
    getCustomerSession(),
    listAddonsForMain(product.id),
    listRelatedProducts(product.id, {
      categoryId: product.categoryId ?? null,
      brandId: product.brandId ?? null,
      limit: 8,
    }),
  ])

  const inStock =
    product.stockType === 'in_stock' && product.stockQuantity > 0
  const ldData = productLd({
    slug: product.slug,
    nameZh: product.nameZh,
    nameJp: product.nameJp,
    description: product.description,
    priceTwd: product.priceTwd,
    brand: brand?.nameZh ?? null,
    imageUrls: images.map((i) => imageUrl(i.cfImageId)),
    inStock,
  })
  const crumbs = breadcrumbLd([
    { name: '首頁', href: '/' },
    { name: '所有選物', href: '/shop' },
    { name: product.nameZh, href: `/shop/${product.slug}` },
  ])

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(ldData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }}
      />
      <nav className="text-xs text-ink-soft mb-8">
        <Link href="/shop" className="hover:text-ink">所有選物</Link>
        {category && (
          <>
            <span className="mx-2">/</span>
            <span>{category.name}</span>
          </>
        )}
      </nav>

      <div className="grid lg:grid-cols-2 gap-12">
        <ProductGallery
          images={images.map((i) => ({
            id: i.id,
            cfImageId: i.cfImageId,
            altText: i.altText,
          }))}
          productName={product.nameZh}
        />

        <div>
          {brand && (
            <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">
              <Link
                href={`/brand/${brand.slug}`}
                className="hover:text-accent"
              >
                {brand.nameZh}
              </Link>
            </p>
          )}
          <h1 className="font-serif text-3xl mb-2">{product.nameZh}</h1>
          {product.nameJp && (
            <p className="text-ink-soft text-sm mb-6">{product.nameJp}</p>
          )}

          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-3xl font-medium">{formatTwd(product.priceTwd)}</span>
            <span className="text-sm text-ink-soft font-jp">
              日本参考価格 {formatJpy(product.priceJpy)}
              <span className="ml-1 text-[10px] tracking-wider">税込</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {ageLabel && (
              <span className="text-xs border border-line px-3 py-1">
                {ageLabel}
              </span>
            )}
            {isPreorder ? (
              <span className="font-jp text-xs bg-warning/20 text-ink px-3 py-1 tracking-wider">
                予約 · 約 10–14 日でお届け
              </span>
            ) : (
              <span className="font-jp text-xs bg-success/20 text-ink px-3 py-1 tracking-wider">
                在庫 {product.stockQuantity} 點
              </span>
            )}
          </div>

          <div className="mb-4 space-y-3">
            <AddToCartButton
              item={{
                productId: product.id,
                slug: product.slug,
                nameZh: product.nameZh,
                priceTwd: product.priceTwd,
                weightG: product.weightG,
                imagePath: images[0]?.cfImageId ?? null,
                stockType: product.stockType,
              }}
              outOfStock={!inStock && product.stockType === 'in_stock'}
            />
            {!inStock && product.stockType === 'in_stock' && (
              <div className="bg-cream-100 border border-line rounded-lg p-4">
                <p className="text-sm font-medium mb-2">補貨通知</p>
                <RestockForm productId={product.id} />
              </div>
            )}
          </div>

          {addons.length > 0 && (
            <AddonsSection
              addons={addons.map((a) => ({
                addonId: a.addon.id,
                productId: a.product.id,
                slug: a.product.slug,
                nameZh: a.product.nameZh,
                originalPrice: a.product.priceTwd,
                addonPrice: a.addon.addonPriceTwd,
                weightG: a.product.weightG,
                stockType: a.product.stockType,
                maxAddonQty: a.addon.maxAddonQty,
              }))}
            />
          )}

          {product.description && (
            <section className="mt-10 pt-8 border-t border-line">
              <h2 className="font-serif text-lg mb-3">商品說明</h2>
              <p className="text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">
                {product.description}
              </p>
            </section>
          )}

          {product.useExperience && (
            <section className="mt-8 p-6 bg-cream-100 rounded-md border border-line">
              <h2 className="font-serif text-lg mb-3">
                {product.minAgeMonths != null ? '我家娃使用心得' : '使用心得'}
              </h2>
              <p className="text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">
                {product.useExperience}
              </p>
            </section>
          )}

          <p className="mt-10 text-xs text-ink-soft leading-relaxed">
            本商品為日本平行輸入個人選物。
            {product.legalNotes ? ` ${product.legalNotes}` : ''}
          </p>
        </div>
      </div>

      <section className="mt-16 pt-8 border-t border-line">
        <header className="flex items-baseline justify-between mb-6">
          <h2 className="font-serif text-2xl">客戶心得</h2>
          {reviewSummary.count > 0 && (
            <p className="text-sm text-ink-soft">
              {'★'.repeat(Math.round(reviewSummary.average))}
              {'☆'.repeat(5 - Math.round(reviewSummary.average))}
              {' '}
              <span className="ml-1">{reviewSummary.average.toFixed(1)} / 5 · {reviewSummary.count} 則</span>
            </p>
          )}
        </header>

        {reviews.length === 0 ? (
          <p className="text-sm text-ink-soft py-6 text-center bg-cream-100 rounded-lg">
            還沒有客戶心得。
          </p>
        ) : (
          <ul className="space-y-6 mb-12">
            {reviews.map((r) => (
              <li key={r.id} className="bg-white border border-line rounded-lg p-5">
                <header className="flex items-baseline justify-between mb-2">
                  <p className="text-sm">
                    {'★'.repeat(r.rating)}
                    {'☆'.repeat(5 - r.rating)}
                    {r.title && <span className="ml-3 font-medium">{r.title}</span>}
                  </p>
                  <span className="text-xs text-ink-soft">
                    {new Date(r.createdAt).toLocaleDateString('zh-TW')}
                    {r.isVerifiedBuyer && (
                      <span className="ml-2 bg-success/15 text-ink px-2 py-0.5 rounded-full">
                        已購買
                      </span>
                    )}
                  </span>
                </header>
                <p className="text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">{r.body}</p>
              </li>
            ))}
          </ul>
        )}

        <div className="bg-cream-100 border border-line rounded-lg p-6">
          <h3 className="font-serif text-lg mb-3">寫下你的心得</h3>
          <ReviewForm productId={product.id} isLoggedIn={!!customerSession} />
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-12 pt-8 border-t border-line">
          <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-4">
            RELATED · 相關商品
          </p>
          <ProductGrid products={related} />
        </section>
      )}

      <RecentlyViewedStrip excludeProductId={product.id} />
      <RecentlyViewedRecorder
        productId={product.id}
        slug={product.slug}
        nameZh={product.nameZh}
        priceTwd={product.priceTwd}
        imagePath={images[0]?.cfImageId ?? null}
      />

      <StickyMobileCTA
        item={{
          productId: product.id,
          slug: product.slug,
          nameZh: product.nameZh,
          priceTwd: product.priceTwd,
          weightG: product.weightG,
          imagePath: images[0]?.cfImageId ?? null,
          stockType: product.stockType,
        }}
        outOfStock={!inStock && product.stockType === 'in_stock'}
      />
    </div>
  )
}
