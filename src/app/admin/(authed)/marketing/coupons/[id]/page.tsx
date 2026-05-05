import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { customerCoupons } from '@/db/schema/customer_coupons'
import { customers } from '@/db/schema/customers'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { getCouponById } from '@/server/services/CouponService'
import { CouponForm } from '@/components/admin/CouponForm'
import { CouponGrantForm } from '@/components/admin/CouponGrantForm'
import {
  updateCouponAction,
  deleteCouponAction,
  revokeCouponGrantAction,
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

  const grants = await db
    .select({
      id: customerCoupons.id,
      claimedAt: customerCoupons.claimedAt,
      usedAt: customerCoupons.usedAt,
      customerName: customers.name,
      customerEmail: customers.email,
    })
    .from(customerCoupons)
    .leftJoin(customers, eq(customerCoupons.customerId, customers.id))
    .where(
      and(
        eq(customerCoupons.orgId, DEFAULT_ORG_ID),
        eq(customerCoupons.couponId, id)
      )
    )
    .orderBy(desc(customerCoupons.claimedAt))

  const usedCount = grants.filter((g) => g.usedAt).length

  const boundUpdate = updateCouponAction.bind(null, id)
  const boundDelete = deleteCouponAction.bind(null, id)

  const canDelete = me.role === 'owner' || me.role === 'manager'

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
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
                if (!confirm(`確定要刪除優惠碼「${coupon.code}」嗎？`)) {
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

      <hr className="my-10 border-line" />

      <section className="space-y-5">
        <header>
          <h2 className="font-serif text-xl mb-1">直接發放給會員</h2>
          <p className="text-ink-soft text-sm">
            把這張優惠券送給特定客戶，他們會在會員中心 → 我的優惠券看到。
          </p>
        </header>

        <CouponGrantForm couponId={coupon.id} />

        <div className="mt-8">
          <h3 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
            已發放清單（{grants.length} 人，{usedCount} 已使用）
          </h3>

          {grants.length === 0 ? (
            <p className="text-ink-soft text-sm">尚未發放給任何會員</p>
          ) : (
            <div className="bg-white border border-line rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-cream-50 text-xs text-ink-soft uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">會員</th>
                    <th className="text-left px-3 py-2 font-medium">領取時間</th>
                    <th className="text-left px-3 py-2 font-medium">狀態</th>
                    <th className="text-right px-3 py-2 font-medium w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {grants.map((g) => (
                    <tr key={g.id} className="border-t border-line">
                      <td className="px-3 py-2">
                        <div>{g.customerName ?? g.customerEmail}</div>
                        {g.customerName && (
                          <div className="text-xs text-ink-soft">{g.customerEmail}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-ink-soft whitespace-nowrap">
                        {new Date(g.claimedAt).toLocaleDateString('zh-Hant')}
                      </td>
                      <td className="px-3 py-2">
                        {g.usedAt ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-ink-soft/15 text-ink-soft">
                            已使用 · {new Date(g.usedAt).toLocaleDateString('zh-Hant')}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-success/15 text-success">
                            未使用
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {!g.usedAt && (
                          <form
                            action={async () => {
                              'use server'
                              await revokeCouponGrantAction(g.id, id)
                            }}
                          >
                            <button
                              type="submit"
                              className="text-xs text-ink-soft hover:text-danger"
                            >
                              收回
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
