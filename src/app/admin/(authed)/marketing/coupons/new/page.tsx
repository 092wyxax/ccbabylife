import Link from 'next/link'
import { CouponForm } from '@/components/admin/CouponForm'
import { createCouponAction } from '@/server/actions/coupons'
import { requireRole } from '@/server/services/AdminAuthService'

export const dynamic = 'force-dynamic'

export default async function NewCouponPage() {
  await requireRole(['owner', 'manager', 'editor'])

  return (
    <div className="p-6 sm:p-8">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/marketing" className="hover:text-ink">行銷</Link>
        <span className="mx-2">/</span>
        <Link href="/admin/marketing/coupons" className="hover:text-ink">優惠券</Link>
        <span className="mx-2">/</span>
        <span>新增</span>
      </nav>

      <h1 className="font-serif text-2xl mb-6">新增優惠券</h1>

      <CouponForm action={createCouponAction} submitLabel="儲存" />
    </div>
  )
}
