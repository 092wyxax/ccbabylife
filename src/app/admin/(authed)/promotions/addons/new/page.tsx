import Link from 'next/link'
import { listProductsForAdmin } from '@/server/services/ProductService'
import { createAddonAction } from '@/server/actions/promotions'
import { AddonForm } from '@/components/admin/AddonForm'

export default async function NewAddonPage() {
  const { rows } = await listProductsForAdmin({ page: { page: 1, pageSize: 500, offset: 0 } })

  return (
    <div className="p-6 sm:p-8 max-w-2xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/promotions" className="hover:text-ink">行銷活動</Link>
        <span className="mx-2">/</span>
        <span>新增加購</span>
      </nav>
      <h1 className="font-serif text-2xl mb-6">新增加購商品</h1>
      <AddonForm
        action={createAddonAction}
        submitLabel="建立"
        products={rows.map((r) => ({
          id: r.product.id,
          name: r.product.nameZh,
          priceTwd: r.product.priceTwd,
        }))}
      />
    </div>
  )
}
