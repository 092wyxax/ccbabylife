import { ProductCard } from './ProductCard'
import { imageUrl } from '@/lib/image'
import type { Product, ProductImage } from '@/db/schema'

interface ProductGridProps {
  products: Array<{
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
    primaryImage: Pick<ProductImage, 'cfImageId' | 'altText'> | null
  }>
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-ink-soft">
        商品上架中，敬請期待。
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
      {products.map(({ product, primaryImage }) => (
        <ProductCard
          key={product.id}
          product={product}
          imageUrl={primaryImage?.cfImageId ? imageUrl(primaryImage.cfImageId) : null}
          imagePath={primaryImage?.cfImageId ?? null}
        />
      ))}
    </div>
  )
}
