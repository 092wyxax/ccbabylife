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
import { WishlistButton } from '@/components/shop/WishlistButton'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { ProductTrustStrip } from '@/components/shop/ProductTrustStrip'
import { SubscribeButton } from '@/components/shop/SubscribeButton'
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
    rating:
      reviewSummary.count > 0
        ? { avg: reviewSummary.average, count: reviewSummary.count }
        : null,
    reviews: reviews.slice(0, 3).map((r) => ({
      rating: r.rating,
      title: r.title,
      body: r.body,
      author: null,
      createdAt: r.createdAt,
    })),
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
              <span className="font-jp text-xs bg-blush-soft text-ink px-3 py-1 tracking-wider rounded-full">
                予約 · 約 10–14 日でお届け
              </span>
            ) : product.stockQuantity <= 3 && product.stockQuantity > 0 ? (
              <span className="font-jp text-xs bg-seal text-cream px-3 py-1 tracking-wider rounded-full animate-pulse">
                ⚡ 僅剩 {product.stockQuantity} 件
              </span>
            ) : (
              <span className="font-jp text-xs bg-sage-soft text-ink px-3 py-1 tracking-wider rounded-full">
                在庫 {product.stockQuantity} 點
              </span>
            )}
          </div>

          <div className="mb-4 space-y-3">
            <div className="flex gap-3 items-stretch">
              <div className="flex-1">
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
              </div>
              <WishlistButton
                variant="button"
                item={{
                  productId: product.id,
                  slug: product.slug,
                  nameZh: product.nameZh,
                  priceTwd: product.priceTwd,
                  imagePath: images[0]?.cfImageId ?? null,
                }}
              />
            </div>
            {!inStock && product.stockType === 'in_stock' && (
              <div className="bg-cream-100 border border-line rounded-lg p-4">
                <p className="text-sm font-medium mb-2">補貨通知</p>
                <RestockForm productId={product.id} />
              </div>
            )}

            {/* Subscribe-to-recurring (only for in-stock items, hidden on out-of-stock) */}
            {product.stockType === 'in_stock' && inStock && (
              <SubscribeButton
                productId={product.id}
                isLoggedIn={!!customerSession}
              />
            )}
          </div>

          <ProductTrustStrip />

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

          <TrialNotesSection product={product} />

          <NotSuitableForSection items={product.notSuitableFor} />

          {product.stockType === 'preorder' && <DelayCompensationBlock />}

          <LegalLabelSection product={product} />

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

function TrialNotesSection({
  product,
}: {
  product: {
    trialDay1: string | null
    trialDay7: string | null
    trialDay14: string | null
    trialPros: string[] | null
    trialCons: string[] | null
    trialRating: number | null
    useExperience: string | null
    minAgeMonths: number | null
  }
}) {
  const hasStructured =
    product.trialDay1 ||
    product.trialDay7 ||
    product.trialDay14 ||
    (product.trialPros && product.trialPros.length > 0) ||
    (product.trialCons && product.trialCons.length > 0)

  if (!hasStructured) {
    if (!product.useExperience) return null
    return (
      <section className="mt-8 p-6 bg-cream-100 rounded-md border border-line">
        <h2 className="font-serif text-lg mb-3">
          {product.minAgeMonths != null ? '我家娃使用心得' : '使用心得'}
        </h2>
        <p className="text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">
          {product.useExperience}
        </p>
      </section>
    )
  }

  const ratingDisplay =
    product.trialRating != null ? (product.trialRating / 10).toFixed(1) : null

  return (
    <section className="mt-8 p-6 bg-cream-100 rounded-md border border-line">
      <header className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-serif text-lg">
          📝 {product.minAgeMonths != null ? '娃媽 14 天試用筆記' : '14 天試用筆記'}
        </h2>
        {ratingDisplay && (
          <p className="text-sm">
            ⭐ {ratingDisplay} / 5.0
          </p>
        )}
      </header>

      <div className="space-y-4">
        {product.trialDay1 && (
          <div>
            <p className="text-xs text-ink-soft mb-1 font-medium tracking-wider">
              DAY 1 · 第一次使用印象
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {product.trialDay1}
            </p>
          </div>
        )}
        {product.trialDay7 && (
          <div>
            <p className="text-xs text-ink-soft mb-1 font-medium tracking-wider">
              DAY 7 · 一週後的觀察
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {product.trialDay7}
            </p>
          </div>
        )}
        {product.trialDay14 && (
          <div>
            <p className="text-xs text-ink-soft mb-1 font-medium tracking-wider">
              DAY 14 · 兩週後的結論
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {product.trialDay14}
            </p>
          </div>
        )}
      </div>

      {(product.trialPros?.length || product.trialCons?.length) && (
        <div className="grid sm:grid-cols-2 gap-4 mt-5 pt-4 border-t border-line/60">
          {product.trialPros && product.trialPros.length > 0 && (
            <div>
              <p className="text-xs text-sage font-medium mb-2 tracking-wider">
                ✓ PROS
              </p>
              <ul className="space-y-1.5 text-sm">
                {product.trialPros.map((p, i) => (
                  <li key={i} className="leading-snug">
                    <span className="text-sage mr-1">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {product.trialCons && product.trialCons.length > 0 && (
            <div>
              <p className="text-xs text-warning font-medium mb-2 tracking-wider">
                ✗ CONS
              </p>
              <ul className="space-y-1.5 text-sm">
                {product.trialCons.map((c, i) => (
                  <li key={i} className="leading-snug">
                    <span className="text-warning mr-1">✗</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function NotSuitableForSection({ items }: { items: string[] | null }) {
  if (!items || items.length === 0) return null
  return (
    <section className="mt-6 p-5 rounded-md border border-warning/30 bg-warning/5">
      <h2 className="font-serif text-base mb-3">🚫 這個產品不適合：</h2>
      <ul className="space-y-1.5 text-sm">
        {items.map((item, i) => (
          <li key={i} className="leading-snug">
            <span className="text-warning mr-1">✗</span>
            {item}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-ink-soft mt-3 leading-relaxed">
        我們把不適合的情況寫出來，讓你買得放心。如果不確定適不適合你，
        歡迎私訊 LINE 詢問。
      </p>
    </section>
  )
}

function DelayCompensationBlock() {
  return (
    <section className="mt-6 p-5 rounded-md border border-line bg-blush-soft/30">
      <h2 className="font-serif text-base mb-2">⏱ 預購延遲承諾</h2>
      <ul className="space-y-1 text-sm">
        <li>
          ・預計 <strong>10–14 天</strong>到貨
        </li>
        <li>
          ・若延遲超過 <strong>14 天</strong>：每延 1 日全單 <strong>1% 折扣</strong>
        </li>
        <li>
          ・若延遲超過 <strong>21 天</strong>：<strong>100% 退費</strong>
        </li>
      </ul>
      <p className="text-[11px] text-ink-soft mt-3 leading-relaxed">
        我們把延遲補償寫出來，是因為對自己的時程有信心。
      </p>
    </section>
  )
}

function LegalLabelSection({
  product,
}: {
  product: {
    legalChineseLabel: string | null
    legalCategory: string | null
    legalShopPromise: string | null
    legalShopLimits: string | null
    legalReturnNote: string | null
    bsmiCode: string | null
    sgsReportNo: string | null
  }
}) {
  const hasAny =
    product.legalChineseLabel ||
    product.legalCategory ||
    product.legalShopPromise ||
    product.legalShopLimits ||
    product.legalReturnNote ||
    product.bsmiCode ||
    product.sgsReportNo
  if (!hasAny) return null

  return (
    <section className="mt-8 p-6 rounded-md border border-line bg-white">
      <h2 className="font-serif text-lg mb-4">📋 法規說明</h2>
      <div className="space-y-4 text-sm">
        {product.legalChineseLabel && (
          <Block label="中文標示">{product.legalChineseLabel}</Block>
        )}
        {product.legalCategory && (
          <Block label="法規分類">{product.legalCategory}</Block>
        )}
        {(product.bsmiCode || product.sgsReportNo) && (
          <div>
            <p className="text-xs text-ink-soft tracking-wider mb-1 font-medium">
              【檢驗證明】
            </p>
            <div className="space-y-1">
              {product.bsmiCode && (
                <p className="leading-relaxed">
                  BSMI 字號：
                  <a
                    href={`https://www.bsmi.gov.tw/wSite/sp?xdUrl=/wMonitor/site/wMonitor_search.jsp&keyword=${encodeURIComponent(product.bsmiCode)}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-mono text-accent hover:underline ml-1"
                  >
                    {product.bsmiCode}
                  </a>
                  <span className="text-ink-soft text-xs ml-2">→ 點擊到標檢局查驗</span>
                </p>
              )}
              {product.sgsReportNo && (
                <p className="leading-relaxed">
                  SGS / TFDA 報告編號：
                  <span className="font-mono ml-1">{product.sgsReportNo}</span>
                </p>
              )}
            </div>
          </div>
        )}
        {product.legalShopPromise && (
          <Block label="熙熙初日的承諾">{product.legalShopPromise}</Block>
        )}
        {product.legalShopLimits && (
          <Block label="誠實揭露 — 我們做不到">{product.legalShopLimits}</Block>
        )}
        {product.legalReturnNote && (
          <Block label="退換貨">{product.legalReturnNote}</Block>
        )}
      </div>
    </section>
  )
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-ink-soft tracking-wider mb-1 font-medium">
        【{label}】
      </p>
      <p className="leading-relaxed whitespace-pre-wrap">{children}</p>
    </div>
  )
}
