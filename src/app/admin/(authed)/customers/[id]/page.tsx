import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getCustomerDetail,
  babyAgeMonths,
} from '@/server/services/CustomerService'
import { STATUS_LABEL, statusBadgeClass } from '@/lib/order-progress'
import { formatTwd } from '@/lib/format'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminCustomerDetailPage({ params }: Props) {
  const { id } = await params
  const detail = await getCustomerDetail(id)
  if (!detail) notFound()

  const { customer, orders, totalSpent } = detail
  const ageM = babyAgeMonths(customer.babyBirthDate)

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
          <section className="bg-white border border-line rounded-lg p-5 text-sm space-y-2">
            <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-2">
              基本資料
            </h2>
            <Row label="姓名" value={customer.name ?? '—'} />
            <Row label="電話" value={customer.phone ?? '—'} />
            <Row label="LINE" value={customer.lineUserId ? '已綁定' : '未綁定'} />
          </section>

          <section className="bg-white border border-line rounded-lg p-5 text-sm space-y-2">
            <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-2">
              寶寶資料
            </h2>
            <Row
              label="出生日期"
              value={customer.babyBirthDate ?? '未提供'}
            />
            <Row
              label="目前月齡"
              value={ageM != null ? `${ageM} 個月` : '—'}
            />
            <Row label="性別" value={customer.babyGender ?? '未提供'} />
          </section>

          <section className="bg-white border border-line rounded-lg p-5 text-sm space-y-2">
            <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-2">
              金額
            </h2>
            <Row label="LTV（已完成訂單）" value={formatTwd(totalSpent)} bold />
            <Row label="購物金餘額" value={formatTwd(customer.storeCredit)} />
          </section>

          <section className="bg-cream-100 border border-line rounded-lg p-4 text-xs text-ink-soft leading-relaxed">
            <p className="font-medium text-ink mb-1">後續開發</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>編輯黑名單 / 標籤</li>
              <li>調整購物金</li>
              <li>客服 LINE 訊息歷史</li>
              <li>個人化推薦記錄</li>
            </ul>
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
