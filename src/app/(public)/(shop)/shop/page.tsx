import { listActiveProducts } from '@/server/services/ProductService'
import { ProductGrid } from '@/components/shop/ProductGrid'

export const metadata = {
  title: '所有選物 | 日系選物店',
  description: '日本母嬰、寵物選物，每週預購批次',
}

export default async function ShopPage() {
  const items = await listActiveProducts({ limit: 60 })

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <header className="mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl">所有選物</h1>
        <p className="text-ink-soft mt-2 text-sm">
          目前共 {items.length} 件商品 · 預購制，每週日截單
        </p>
      </header>

      <ProductGrid products={items} />
    </div>
  )
}
