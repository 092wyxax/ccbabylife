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
        {/* Borderless card — image is the boundary; subtle bg only */}
        <div className="aspect-square bg-cream-100 rounded-sm overflow-hidden mb-4 relative">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={product.nameZh}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-soft text-xs">
              尚無商品圖
            </div>
          )}

          {product.stockType === 'preorder' && (
            <span className="font-jp absolute top-3 left-3 bg-cream/95 text-ink text-[10px] px-2.5 py-1 tracking-[0.2em] rounded-full">
              予約
            </span>
          )}
          {isOutOfStock && (
            // Off-tone instead of red — feels less like an error
            <span className="font-jp absolute top-3 left-3 bg-cream-200 text-ink-soft text-[10px] px-2.5 py-1 tracking-[0.2em] rounded-full">
              完売
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

        <div className="space-y-1.5 px-0.5">
          {ageLabel && (
            <p className="font-jp text-[10px] text-ink-soft tracking-[0.25em] uppercase">
              {ageLabel}
            </p>
          )}
          <h3 className="text-sm leading-relaxed group-hover:text-accent transition-colors line-clamp-2">
            {product.nameZh}
          </h3>
          <p className="font-serif text-base">{formatTwd(product.priceTwd)}</p>
        </div>
      </Link>
    </div>
  )
}
