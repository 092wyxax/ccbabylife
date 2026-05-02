import { ProductCard } from './ProductCard'
import type { Product, ProductImage } from '@/db/schema'

interface ProductGridProps {
  products: Array<{
    product: Pick<Product, 'id' | 'slug' | 'nameZh' | 'priceTwd' | 'minAgeMonths' | 'maxAgeMonths' | 'stockType' | 'stockQuantity' | 'tags'>
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
          imageUrl={primaryImage?.cfImageId ? cfImageUrl(primaryImage.cfImageId) : null}
        />
      ))}
    </div>
  )
}

function cfImageUrl(cfImageId: string): string {
  // TODO(integration): 等 Cloudflare Images 串接後改成真正的 delivery URL。
  // 目前 sample seed 直接放 placeholder URL 在 cfImageId 欄位。
  if (cfImageId.startsWith('http')) return cfImageId
  return `https://imagedelivery.net/${cfImageId}/public`
}
