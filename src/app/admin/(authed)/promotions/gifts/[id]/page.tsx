import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getGiftById } from '@/server/services/PromotionService'
import { listProductsForAdmin } from '@/server/services/ProductService'
import { GiftForm } from '@/components/admin/GiftForm'
import { updateGiftAction } from '@/server/actions/promotions'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditGiftPage({ params }: Props) {
  const { id } = await params
  const [gift, { rows }] = await Promise.all([
    getGiftById(id),
    listProductsForAdmin({ page: { page: 1, pageSize: 500, offset: 0 } }),
  ])
  if (!gift) notFound()

  const boundUpdate = updateGiftAction.bind(null, id)

  return (
    <div className="p-6 sm:p-8 max-w-2xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/promotions" className="hover:text-ink">行銷活動</Link>
        <span className="mx-2">/</span>
        <span>{gift.name}</span>
      </nav>
      <h1 className="font-serif text-2xl mb-6">編輯：{gift.name}</h1>
      <GiftForm
        gift={gift}
        action={boundUpdate}
        submitLabel="儲存變更"
        products={rows.map((r) => ({ id: r.product.id, name: r.product.nameZh }))}
      />
    </div>
  )
}
