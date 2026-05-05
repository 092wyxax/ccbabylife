import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCouponById } from '@/server/services/CouponService'
import { CouponForm } from '@/components/admin/CouponForm'
import {
  updateCouponAction,
  deleteCouponAction,
} from '@/server/actions/coupons'
import { requireRole } from '@/server/services/AdminAuthService'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditCouponPage({ params }: Props) {
  const me = await requireRole(['owner', 'manager', 'editor'])
  const { id } = await params

  const coupon = await getCouponById(id)
  if (!coupon) notFound()

  const boundUpdate = updateCouponAction.bind(null, id)
  const boundDelete = deleteCouponAction.bind(null, id)

  const canDelete = me.role === 'owner' || me.role === 'manager'

  return (
    <div className="p-6 sm:p-8">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/marketing" className="hover:text-ink">行銷</Link>
        <span className="mx-2">/</span>
        <Link href="/admin/marketing/coupons" className="hover:text-ink">優惠券</Link>
        <span className="mx-2">/</span>
        <span className="font-mono">{coupon.code}</span>
      </nav>

      <header className="flex items-start justify-between mb-6 gap-4">
        <h1 className="font-serif text-2xl">
          編輯：<span className="font-mono">{coupon.code}</span>
        </h1>
        {canDelete && (
          <form action={boundDelete}>
            <button
              type="submit"
              className="text-sm text-danger hover:underline"
              onClick={(e) => {
                if (
                  !confirm(`確定要刪除優惠碼「${coupon.code}」嗎？`)
                ) {
                  e.preventDefault()
                }
              }}
            >
              刪除
            </button>
          </form>
        )}
      </header>

      <CouponForm
        coupon={coupon}
        action={boundUpdate}
        submitLabel="儲存變更"
      />
    </div>
  )
}
