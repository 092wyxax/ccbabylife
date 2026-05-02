import Link from 'next/link'
import { listCustomers, babyAgeMonths } from '@/server/services/CustomerService'
import { formatTwd } from '@/lib/format'

export default async function AdminCustomersPage() {
  const rows = await listCustomers()

  return (
    <div className="p-8 max-w-7xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl mb-1">客戶管理</h1>
        <p className="text-ink-soft text-sm">共 {rows.length} 位</p>
      </header>

      {rows.length === 0 ? (
        <div className="bg-white border border-line rounded-lg p-12 text-center">
          <p className="text-ink-soft mb-2">目前沒有客戶。</p>
          <p className="text-xs text-ink-soft">
            Phase 1b 結帳開放後，第一位客戶下單會自動建立紀錄。
          </p>
        </div>
      ) : (
        <div className="bg-white border border-line rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-ink-soft">
              <tr>
                <th className="text-left px-4 py-3 font-normal">姓名 / Email</th>
                <th className="text-left px-4 py-3 font-normal">寶寶月齡</th>
                <th className="text-right px-4 py-3 font-normal">訂單數</th>
                <th className="text-right px-4 py-3 font-normal">LTV</th>
                <th className="text-left px-4 py-3 font-normal">建立日期</th>
                <th className="text-left px-4 py-3 font-normal">標記</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ customer, orderCount, totalSpent }) => {
                const ageM = babyAgeMonths(customer.babyBirthDate)
                return (
                  <tr key={customer.id} className="border-t border-line hover:bg-cream-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="hover:text-accent"
                      >
                        {customer.name ?? customer.email}
                      </Link>
                      <p className="text-xs text-ink-soft mt-0.5">{customer.email}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {ageM != null ? `${ageM} 個月` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-ink-soft">{orderCount}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatTwd(totalSpent)}
                    </td>
                    <td className="px-4 py-3 text-ink-soft text-xs">
                      {new Date(customer.createdAt).toLocaleDateString('zh-TW')}
                    </td>
                    <td className="px-4 py-3 space-x-1">
                      {customer.isBlacklisted && (
                        <span className="text-xs bg-danger/15 text-danger px-2 py-0.5 rounded-full">
                          黑名單
                        </span>
                      )}
                      {customer.lineUserId && (
                        <span className="text-xs bg-success/15 text-ink px-2 py-0.5 rounded-full">
                          LINE
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
