import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq, and, asc } from 'drizzle-orm'
import { db } from '@/db/client'
import { productImages } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import {
  getProductById,
  listAllBrands,
  listAllCategories,
} from '@/server/services/ProductService'
import {
  updateProductAction,
  archiveProductAction,
  type ProductFormState,
} from '@/server/actions/products'
import { ProductForm } from '@/components/admin/ProductForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params

  const [product, brands, categories] = await Promise.all([
    getProductById(id),
    listAllBrands(),
    listAllCategories(),
  ])
  if (!product) notFound()

  const images = await db
    .select()
    .from(productImages)
    .where(and(eq(productImages.productId, id), eq(productImages.orgId, DEFAULT_ORG_ID)))
    .orderBy(asc(productImages.sortOrder))
  const imageUrls = images.map((i) => i.cfImageId)

  // Bind id into the action so the form receives a (state, formData) shaped action
  const boundUpdate = async (
    prevState: ProductFormState,
    formData: FormData
  ): Promise<ProductFormState> => {
    'use server'
    return updateProductAction(id, prevState, formData)
  }

  const boundArchive = async () => {
    'use server'
    await archiveProductAction(id)
  }

  return (
    <div className="p-8 max-w-3xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/products" className="hover:text-ink">商品管理</Link>
        <span className="mx-2">/</span>
        <span>{product.nameZh}</span>
      </nav>

      <div className="flex items-start justify-between mb-8 pb-4 border-b border-line">
        <div>
          <h1 className="font-serif text-2xl mb-1">{product.nameZh}</h1>
          <p className="text-ink-soft text-sm">
            slug: {product.slug} ·{' '}
            <Link
              href={`/shop/${product.slug}`}
              target="_blank"
              className="underline hover:text-accent"
            >
              在前台查看
            </Link>
          </p>
        </div>
        {product.status !== 'archived' && (
          <form action={boundArchive}>
            <button
              type="submit"
              className="text-sm text-ink-soft hover:text-danger underline"
            >
              封存此商品
            </button>
          </form>
        )}
      </div>

      <ProductForm
        mode="edit"
        product={product}
        brands={brands}
        categories={categories}
        imageUrls={imageUrls}
        action={boundUpdate}
      />
    </div>
  )
}
