import Link from 'next/link'
import { formatTwd, formatAgeRange } from '@/lib/format'
import type { Product } from '@/db/schema'

interface ProductCardProps {
  product: Pick<Product, 'slug' | 'nameZh' | 'priceTwd' | 'minAgeMonths' | 'maxAgeMonths' | 'stockType' | 'stockQuantity' | 'tags'>
  imageUrl?: string | null
}

export function ProductCard({ product, imageUrl }: ProductCardProps) {
  const ageLabel = formatAgeRange(product.minAgeMonths, product.maxAgeMonths)
  const isOutOfStock = product.stockType === 'in_stock' && product.stockQuantity <= 0

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group block"
    >
      <div className="aspect-square bg-cream-100 border border-line rounded-md overflow-hidden mb-3 relative">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={product.nameZh}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-soft text-xs">
            尚無商品圖
          </div>
        )}

        {product.stockType === 'preorder' && (
          <span className="absolute top-2 left-2 bg-cream/90 text-ink text-xs px-2 py-0.5 rounded-full">
            預購
          </span>
        )}
        {isOutOfStock && (
          <span className="absolute top-2 left-2 bg-danger text-white text-xs px-2 py-0.5 rounded-full">
            售完
          </span>
        )}
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
  )
}
