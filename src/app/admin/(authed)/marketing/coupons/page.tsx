import Link from 'next/link'
import { listCoupons } from '@/server/services/CouponService'
import { CouponAddForm } from '@/components/admin/CouponAddForm'
import { toggleCouponActiveFormAction } from '@/server/actions/coupons'
import { formatTwd } from '@/lib/format'

export default async function CouponsAdminPage() {
  const coupons = await listCoupons()

  return (
    <div className="p-8 max-w-6xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/marketing" className="hover:text-ink">行銷</Link>
        <span className="mx-2">/</span>
        <span>優惠碼</span>
      </nav>

      <h1 className="font-serif text-2xl mb-1">優惠碼</h1>
      <p className="text-ink-soft text-sm mb-8">
        客戶結帳時可輸入優惠碼折抵。固定金額或百分比擇一。
      </p>

      <section className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div>
          <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
            目前 {coupons.length} 組
          </h2>
          {coupons.length === 0 ? (
            <div className="bg-white border border-line rounded-lg p-8 text-center text-ink-soft text-sm">
              還沒有優惠碼，從右側新增。
            </div>
          ) : (
            <div className="bg-white border border-line rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-cream-100 text-ink-soft">
                  <tr>
                    <th className="text-left px-3 py-2 font-normal">代碼</th>
                    <th className="text-left px-3 py-2 font-normal">折扣</th>
                    <th className="text-right px-3 py-2 font-normal">低消</th>
                    <th className="text-right px-3 py-2 font-normal">使用 / 上限</th>
                    <th className="text-left px-3 py-2 font-normal">到期</th>
                    <th className="text-left px-3 py-2 font-normal">狀態</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.id} className="border-t border-line">
                      <td className="px-3 py-2 font-mono">{c.code}</td>
                      <td className="px-3 py-2">
                        {c.type === 'fixed'
                          ? `−${formatTwd(c.value)}`
                          : `−${c.value}%`}
                      </td>
                      <td className="px-3 py-2 text-right text-ink-soft">
                        {c.minOrderTwd > 0 ? formatTwd(c.minOrderTwd) : '無'}
                      </td>
                      <td className="px-3 py-2 text-right text-ink-soft">
                        {c.usedCount} / {c.maxUses ?? '∞'}
                      </td>
                      <td className="px-3 py-2 text-ink-soft text-xs">
                        {c.expiresAt
                          ? new Date(c.expiresAt).toLocaleDateString('zh-TW')
                          : '永久'}
                      </td>
                      <td className="px-3 py-2">
                        <form action={toggleCouponActiveFormAction}>
                          <input type="hidden" name="id" value={c.id} />
                          <button
                            type="submit"
                            className={
                              'text-xs px-2 py-0.5 rounded-full ' +
                              (c.isActive
                                ? 'bg-success/15 hover:bg-success/30'
                                : 'bg-ink/10 text-ink-soft hover:bg-ink/20')
                            }
                          >
                            {c.isActive ? '啟用中' : '停用'}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside>
          <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
            新增優惠碼
          </h2>
          <CouponAddForm />
        </aside>
      </section>
    </div>
  )
}
