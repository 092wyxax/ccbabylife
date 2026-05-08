import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq, and, asc } from 'drizzle-orm'
import { db } from '@/db/client'
import { productImages, productVariants, type Product } from '@/db/schema'
import { VariantsPanel } from '@/components/admin/VariantsPanel'
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
import { ProductDeleteButton } from '@/components/admin/ProductDeleteButton'

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

  const variants = await db
    .select()
    .from(productVariants)
    .where(and(eq(productVariants.productId, id), eq(productVariants.orgId, DEFAULT_ORG_ID)))
    .orderBy(asc(productVariants.createdAt))

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

      <div className="flex items-start justify-between mb-4 pb-4 border-b border-line">
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
        <div className="flex items-start gap-4 flex-col sm:flex-row sm:items-center">
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
          <ProductDeleteButton productId={id} productName={product.nameZh} />
        </div>
      </div>

      <StatusBanner status={product.status} hasImages={imageUrls.length > 0} hasDescription={Boolean(product.description)} />

      <ProductForm
        mode="edit"
        product={product}
        brands={brands}
        categories={categories}
        imageUrls={imageUrls}
        action={boundUpdate}
      />

      <div className="mt-12 pt-8 border-t border-line">
        <VariantsPanel productId={product.id} variants={variants} />
      </div>
    </div>
  )
}

function StatusBanner({
  status,
  hasImages,
  hasDescription,
}: {
  status: Product['status']
  hasImages: boolean
  hasDescription: boolean
}) {
  if (status === 'active') {
    const incomplete: string[] = []
    if (!hasImages) incomplete.push('沒有圖片')
    if (!hasDescription) incomplete.push('沒有商品說明')
    if (incomplete.length > 0) {
      return (
        <div className="mb-6 bg-warning/15 border border-warning/40 text-ink p-4 rounded-md text-sm">
          <strong>已上架，但 {incomplete.join('、')}</strong>。客戶看得到此商品，但體驗不佳，建議補齊。
        </div>
      )
    }
    return (
      <div className="mb-6 bg-success/15 border border-success/40 text-ink p-4 rounded-md text-sm">
        <strong>上架中</strong>：客戶可在前台 <Link href="/shop" target="_blank" className="underline">/shop</Link> 看到此商品。
      </div>
    )
  }

  if (status === 'draft') {
    return (
      <div className="mb-6 bg-line border border-ink/10 text-ink p-4 rounded-md text-sm">
        <strong>草稿狀態</strong>：客戶在前台<strong>看不到</strong>此商品。確認資料無誤後，請把下方「狀態」改為「上架中」並儲存。
      </div>
    )
  }

  return (
    <div className="mb-6 bg-ink/10 border border-ink/20 text-ink-soft p-4 rounded-md text-sm">
      <strong>已封存</strong>：此商品不顯示於前台，也不出現在後台列表的預設視圖。
    </div>
  )
}
