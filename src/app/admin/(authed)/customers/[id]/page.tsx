import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getCustomerDetail,
  babyAgeMonths,
} from '@/server/services/CustomerService'
import { getTierById } from '@/server/services/MemberTierService'
import { STATUS_LABEL, statusBadgeClass } from '@/lib/order-progress'
import { formatTwd } from '@/lib/format'
import {
  ProfileEditPanel,
  BlacklistTogglePanel,
  StoreCreditPanel,
  TagsPanel,
} from '@/components/admin/CustomerEditPanels'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminCustomerDetailPage({ params }: Props) {
  const { id } = await params
  const detail = await getCustomerDetail(id)
  if (!detail) notFound()

  const { customer, orders, totalSpent } = detail
  const ageM = babyAgeMonths(customer.babyBirthDate)
  const tier = customer.tierId ? await getTierById(customer.tierId) : null

  return (
    <div className="p-8 max-w-5xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/customers" className="hover:text-ink">客戶管理</Link>
        <span className="mx-2">/</span>
        <span>{customer.name ?? customer.email}</span>
      </nav>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-8">
          <header>
            <h1 className="font-serif text-2xl mb-2">{customer.name ?? customer.email}</h1>
            <p className="text-ink-soft text-sm">{customer.email}</p>
            <div className="flex gap-2 mt-3">
              {customer.isBlacklisted && (
                <span className="text-xs bg-danger/15 text-danger px-2 py-0.5 rounded-full">
                  黑名單
                </span>
              )}
              {customer.lineUserId && (
                <span className="text-xs bg-success/15 text-ink px-2 py-0.5 rounded-full">
                  已綁 LINE
                </span>
              )}
              {customer.referralCode && (
                <span className="text-xs bg-line text-ink px-2 py-0.5 rounded-full">
                  推薦碼 {customer.referralCode}
                </span>
              )}
            </div>
          </header>

          <section>
            <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
              訂單歷史（共 {orders.length} 筆）
            </h2>
            {orders.length === 0 ? (
              <div className="bg-white border border-line rounded-lg p-6 text-center text-ink-soft text-sm">
                這位客戶還沒有訂單。
              </div>
            ) : (
              <div className="bg-white border border-line rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-cream-100 text-ink-soft">
                    <tr>
                      <th className="text-left px-4 py-2 font-normal">訂單編號</th>
                      <th className="text-left px-4 py-2 font-normal">狀態</th>
                      <th className="text-right px-4 py-2 font-normal">金額</th>
                      <th className="text-left px-4 py-2 font-normal">建立日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-t border-line hover:bg-cream-50">
                        <td className="px-4 py-2 font-mono text-xs">
                          <Link href={`/admin/orders/${o.id}`} className="hover:text-accent">
                            {o.orderNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadgeClass(o.status)}`}>
                            {STATUS_LABEL[o.status]}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          {formatTwd(o.total)}
                        </td>
                        <td className="px-4 py-2 text-ink-soft text-xs">
                          {new Date(o.createdAt).toLocaleDateString('zh-TW')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="bg-white border border-line rounded-lg p-5">
            <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
              基本資料 + 寶寶
            </h2>
            <ProfileEditPanel customer={customer} />
            <p className="text-xs text-ink-soft mt-3 pt-3 border-t border-line">
              目前月齡：{ageM != null ? `${ageM} 個月` : '—'} · LINE：
              {customer.lineUserId ? '已綁定' : '未綁定'}
            </p>
          </section>

          <section className="bg-white border border-line rounded-lg p-5">
            <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
              金額
            </h2>
            <Row label="LTV（已完成訂單）" value={formatTwd(totalSpent)} bold />
            <Row
              label="會員等級"
              value={
                tier
                  ? `${tier.name}${tier.discountBp > 0 ? ` (${(tier.discountBp / 100).toFixed(tier.discountBp % 100 === 0 ? 0 : 1)}%)` : ''}`
                  : '—'
              }
            />
          </section>

          <section className="bg-white border border-line rounded-lg p-5">
            <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
              購物金
            </h2>
            <StoreCreditPanel customer={customer} />
          </section>

          <section className="bg-white border border-line rounded-lg p-5">
            <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
              標籤
            </h2>
            <TagsPanel customer={customer} />
          </section>

          <section className="bg-white border border-line rounded-lg p-5">
            <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
              黑名單
            </h2>
            <BlacklistTogglePanel customer={customer} />
            <p className="text-xs text-ink-soft mt-3 leading-relaxed">
              黑名單客戶在前台 checkout 時會被擋下；歷史訂單照保留。
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-ink-soft flex-shrink-0">{label}</span>
      <span className={(bold ? 'font-medium ' : '') + 'text-right break-all'}>{value}</span>
    </div>
  )
}
