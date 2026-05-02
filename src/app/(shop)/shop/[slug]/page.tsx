import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProductBySlug } from '@/server/services/ProductService'
import { formatTwd, formatJpy, formatAgeRange } from '@/lib/format'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const detail = await getProductBySlug(slug)
  if (!detail) return { title: '商品不存在 | 日系選物店' }
  return {
    title: `${detail.product.nameZh} | 日系選物店`,
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

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
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
        <div className="space-y-3">
          <div className="aspect-square bg-cream-100 border border-line rounded-md overflow-hidden">
            {images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[0].cfImageId.startsWith('http') ? images[0].cfImageId : `https://imagedelivery.net/${images[0].cfImageId}/public`}
                alt={images[0].altText ?? product.nameZh}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-ink-soft text-sm">
                尚無商品圖
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.slice(1).map((img) => (
                <div
                  key={img.id}
                  className="aspect-square bg-cream-100 border border-line rounded-md overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.cfImageId.startsWith('http') ? img.cfImageId : `https://imagedelivery.net/${img.cfImageId}/public`}
                    alt={img.altText ?? product.nameZh}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {brand && (
            <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">
              {brand.nameZh}
            </p>
          )}
          <h1 className="font-serif text-3xl mb-2">{product.nameZh}</h1>
          {product.nameJp && (
            <p className="text-ink-soft text-sm mb-6">{product.nameJp}</p>
          )}

          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-3xl font-medium">{formatTwd(product.priceTwd)}</span>
            <span className="text-sm text-ink-soft">日本售價 {formatJpy(product.priceJpy)}</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {ageLabel && (
              <span className="text-xs border border-line rounded-full px-3 py-1">
                {ageLabel}
              </span>
            )}
            {isPreorder ? (
              <span className="text-xs bg-warning/20 text-ink rounded-full px-3 py-1">
                預購 · 約 10–14 天到貨
              </span>
            ) : (
              <span className="text-xs bg-success/20 text-ink rounded-full px-3 py-1">
                現貨庫存 {product.stockQuantity}
              </span>
            )}
          </div>

          <button
            type="button"
            className="w-full bg-ink text-cream py-4 rounded-full hover:bg-accent transition-colors mb-4"
            disabled
          >
            加入購物車（Phase 1b 開放）
          </button>

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
              <h2 className="font-serif text-lg mb-3">我家娃使用心得</h2>
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
    </div>
  )
}
