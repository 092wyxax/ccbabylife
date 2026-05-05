import Link from 'next/link'
import { listCoupons } from '@/server/services/CouponService'
import { toggleCouponActiveFormAction } from '@/server/actions/coupons'
import { formatTwd } from '@/lib/format'
import { requireRole } from '@/server/services/AdminAuthService'
import type { Coupon, CouponType, CouponAutoIssue } from '@/db/schema/coupons'

export const dynamic = 'force-dynamic'

const TYPE_LABEL: Record<CouponType, string> = {
  fixed: '固定金額',
  percent: '百分比',
  free_shipping: '免運',
  tiered: '滿額折',
}

const AUTO_ISSUE_LABEL: Record<CouponAutoIssue, string> = {
  manual: '手動',
  signup: '新會員',
  birthday: '生日',
  restock_filled: '補貨完成',
  referral_complete: '推薦成功',
}

function describeDiscount(c: Coupon): string {
  if (c.type === 'free_shipping') return '免運'
  if (c.type === 'percent') return `${c.value}% off`
  if (c.type === 'tiered') return `滿 ${formatTwd(c.minOrderTwd)} 折 ${formatTwd(c.value)}`
  return `折 ${formatTwd(c.value)}`
}

export default async function CouponsAdminPage() {
  await requireRole(['owner', 'manager', 'editor'])
  const coupons = await listCoupons()

  return (
    <div className="p-6 sm:p-8 max-w-6xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/marketing" className="hover:text-ink">行銷</Link>
        <span className="mx-2">/</span>
        <span>優惠券</span>
      </nav>

      <header className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-serif text-2xl mb-1">優惠券</h1>
          <p className="text-ink-soft text-sm">
            支援固定金額 / 百分比 / 免運 / 滿額折，可設使用限制與自動發放規則。
          </p>
        </div>
        <Link
          href="/admin/marketing/coupons/new"
          className="bg-ink text-cream px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors whitespace-nowrap"
        >
          + 新增優惠券
        </Link>
      </header>

      {coupons.length === 0 ? (
        <div className="bg-white border border-line rounded-lg p-12 text-center">
          <p className="text-ink-soft text-sm mb-4">還沒有優惠券。</p>
          <Link
            href="/admin/marketing/coupons/new"
            className="text-sm text-accent hover:underline"
          >
            新增第一張 →
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-line rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 border-b border-line text-xs text-ink-soft uppercase tracking-wider">
              <tr>
                <th className="text-left px-3 py-3 font-medium">代碼</th>
                <th className="text-left px-3 py-3 font-medium">類型</th>
                <th className="text-left px-3 py-3 font-medium">折扣</th>
                <th className="text-right px-3 py-3 font-medium">使用</th>
                <th className="text-left px-3 py-3 font-medium">期限</th>
                <th className="text-left px-3 py-3 font-medium">發放</th>
                <th className="text-left px-3 py-3 font-medium">狀態</th>
                <th className="text-right px-3 py-3 font-medium w-24"></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0 hover:bg-cream-50/50">
                  <td className="px-3 py-3">
                    <Link
                      href={`/admin/marketing/coupons/${c.id}`}
                      className="font-mono font-medium hover:text-accent"
                    >
                      {c.code}
                    </Link>
                    {c.description && (
                      <p className="text-xs text-ink-soft mt-0.5 truncate max-w-[200px]">
                        {c.description}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-ink-soft text-xs">
                    {TYPE_LABEL[c.type]}
                  </td>
                  <td className="px-3 py-3">{describeDiscount(c)}</td>
                  <td className="px-3 py-3 text-right text-xs">
                    {c.usedCount} / {c.maxUses ?? '∞'}
                  </td>
                  <td className="px-3 py-3 text-xs text-ink-soft whitespace-nowrap">
                    {c.expiresAt
                      ? new Date(c.expiresAt).toLocaleDateString('zh-Hant')
                      : '無期限'}
                  </td>
                  <td className="px-3 py-3 text-xs text-ink-soft">
                    {AUTO_ISSUE_LABEL[c.autoIssueOn]}
                  </td>
                  <td className="px-3 py-3">
                    <form action={toggleCouponActiveFormAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className={
                          'text-xs px-2 py-0.5 rounded ' +
                          (c.isActive
                            ? 'bg-success/15 text-success hover:bg-success/25'
                            : 'bg-ink-soft/15 text-ink-soft hover:bg-ink-soft/25')
                        }
                      >
                        {c.isActive ? '啟用' : '停用'}
                      </button>
                    </form>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Link
                      href={`/admin/marketing/coupons/${c.id}`}
                      className="text-xs text-ink-soft hover:text-accent"
                    >
                      編輯
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
