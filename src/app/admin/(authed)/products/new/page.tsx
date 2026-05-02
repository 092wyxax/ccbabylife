import Link from 'next/link'
import { ProductForm } from '@/components/admin/ProductForm'
import {
  listAllBrands,
  listAllCategories,
} from '@/server/services/ProductService'
import { createProductAction } from '@/server/actions/products'

export default async function NewProductPage() {
  const [brands, categories] = await Promise.all([
    listAllBrands(),
    listAllCategories(),
  ])

  return (
    <div className="p-8 max-w-3xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/products" className="hover:text-ink">商品管理</Link>
        <span className="mx-2">/</span>
        <span>新增</span>
      </nav>

      <h1 className="font-serif text-2xl mb-1">新增商品</h1>
      <p className="text-ink-soft text-sm mb-8">
        建立後預設為「草稿」，確認資訊與法規檢核後再切換為「上架中」。
      </p>

      <ProductForm
        mode="create"
        brands={brands}
        categories={categories}
        action={createProductAction}
      />
    </div>
  )
}
