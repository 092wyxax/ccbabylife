import Link from 'next/link'
import { listReturnsForAdmin } from '@/server/services/ReturnService'
import { formatTwd } from '@/lib/format'
import { requireRole } from '@/server/services/AdminAuthService'

export const dynamic = 'force-dynamic'

const STATUS_LABEL = {
  pending: { label: '審核中', cls: 'bg-warning/15 text-warning' },
  approved: { label: '已同意', cls: 'bg-info/15 text-info' },
  rejected: { label: '已拒絕', cls: 'bg-danger/10 text-danger' },
  received: { label: '已收貨', cls: 'bg-info/15 text-ink' },
  refunded: { label: '已退款', cls: 'bg-success/15 text-success' },
  cancelled: { label: '已取消', cls: 'bg-ink/10 text-ink-soft' },
} as const

const TYPE_LABEL = {
  return: '退貨',
  exchange: '換貨',
} as const

export default async function AdminReturnsPage() {
  await requireRole(['owner', 'manager', 'ops'])
  const rows = await listReturnsForAdmin({ limit: 200 })

  const pendingCount = rows.filter((r) => r.request.status === 'pending').length

  return (
    <div className="p-6 sm:p-8 max-w-6xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl mb-1">退換貨申請</h1>
        <p className="text-ink-soft text-sm">
          客戶從訂單追蹤頁送出的退換貨申請。
          {pendingCount > 0 && (
            <span className="ml-2 bg-warning/20 text-ink px-2 py-0.5 rounded text-xs">
              {pendingCount} 筆待審核
            </span>
          )}
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="bg-white border border-line border-dashed rounded-lg p-12 text-center text-ink-soft text-sm">
          尚無退換貨申請。
        </div>
      ) : (
        <div className="bg-white border border-line rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-ink-soft">
              <tr>
                <th className="text-left px-4 py-3 font-normal">申請編號</th>
                <th className="text-left px-4 py-3 font-normal">類型</th>
                <th className="text-left px-4 py-3 font-normal">客戶</th>
                <th className="text-left px-4 py-3 font-normal">訂單</th>
                <th className="text-right px-4 py-3 font-normal">金額</th>
                <th className="text-left px-4 py-3 font-normal">狀態</th>
                <th className="text-left px-4 py-3 font-normal">提交時間</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ request, order, customerName, customerEmail }) => {
                const s = STATUS_LABEL[request.status as keyof typeof STATUS_LABEL]
                return (
                  <tr key={request.id} className="border-t border-line hover:bg-cream-50">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link
                        href={`/admin/returns/${request.id}`}
                        className="hover:text-accent underline-offset-2 hover:underline"
                      >
                        {request.requestNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {TYPE_LABEL[request.type as keyof typeof TYPE_LABEL] ?? request.type}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {customerName ?? '—'}
                      <p className="text-ink-soft">{customerEmail ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {order ? (
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono hover:text-accent"
                        >
                          {order.orderNumber}
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {request.refundTwd != null ? formatTwd(request.refundTwd) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${s.cls}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-soft">
                      {new Date(request.createdAt).toLocaleString('zh-TW')}
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
