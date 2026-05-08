import Link from 'next/link'
import { formatTwd, formatAgeRange } from '@/lib/format'
import type { Product } from '@/db/schema'
import { QuickViewButton } from './QuickViewButton'
import { WishlistButton } from './WishlistButton'

interface ProductCardProps {
  product: Pick<
    Product,
    | 'id'
    | 'slug'
    | 'nameZh'
    | 'priceTwd'
    | 'weightG'
    | 'minAgeMonths'
    | 'maxAgeMonths'
    | 'stockType'
    | 'stockQuantity'
    | 'tags'
  >
  imageUrl?: string | null
  imagePath?: string | null
}

export function ProductCard({ product, imageUrl, imagePath }: ProductCardProps) {
  const ageLabel = formatAgeRange(product.minAgeMonths, product.maxAgeMonths)
  const isOutOfStock = product.stockType === 'in_stock' && product.stockQuantity <= 0

  return (
    <div className="group block relative">
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="aspect-square bg-cream-100 border border-line rounded-md overflow-hidden mb-3 relative">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={product.nameZh}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-soft text-xs">
              尚無商品圖
            </div>
          )}

          {product.stockType === 'preorder' && (
            <span className="font-jp absolute top-2 left-2 bg-cream/95 text-ink text-[11px] px-2 py-0.5 tracking-wider">
              予約 · 預購
            </span>
          )}
          {isOutOfStock && (
            <span className="font-jp absolute top-2 left-2 bg-danger text-white text-[11px] px-2 py-0.5 tracking-wider">
              完売 · 售完
            </span>
          )}

          <WishlistButton
            item={{
              productId: product.id,
              slug: product.slug,
              nameZh: product.nameZh,
              priceTwd: product.priceTwd,
              imagePath: imagePath ?? null,
            }}
          />

          <QuickViewButton
            item={{
              productId: product.id,
              slug: product.slug,
              nameZh: product.nameZh,
              priceTwd: product.priceTwd,
              weightG: product.weightG,
              imagePath: imagePath ?? null,
              stockType: product.stockType,
            }}
            imageUrl={imageUrl ?? null}
            outOfStock={isOutOfStock}
          />
        </div>

        <div className="space-y-1">
          {ageLabel && (
            <p className="text-xs text-ink-soft tracking-widest">{ageLabel}</p>
          )}
          <h3 className="text-sm leading-snug group-hover:text-accent transition-colors line-clamp-2">
            {product.nameZh}
          </h3>
          <p className="text-base font-medium">{formatTwd(product.priceTwd)}</p>
        </div>
      </Link>
    </div>
  )
}
