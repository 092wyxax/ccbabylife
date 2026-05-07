import Link from 'next/link'
import { listOrdersForAdmin } from '@/server/services/OrderService'
import { STATUS_LABEL, statusBadgeClass } from '@/lib/order-progress'
import { formatTwd } from '@/lib/format'
import { parsePage } from '@/lib/pagination'
import { Pagination, SearchBox } from '@/components/admin/Pagination'
import { orderStatusEnum, type OrderStatus } from '@/db/schema'

interface Props {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const params = await searchParams
  const status =
    params.status && (orderStatusEnum as readonly string[]).includes(params.status)
      ? (params.status as OrderStatus)
      : undefined

  const page = parsePage(params.page)
  const result = await listOrdersForAdmin({
    search: params.q,
    status,
    page,
  })

  const buildHref = (p: number) => {
    const usp = new URLSearchParams()
    if (params.q) usp.set('q', params.q)
    if (params.status) usp.set('status', params.status)
    if (p > 1) usp.set('page', String(p))
    const qs = usp.toString()
    return qs ? `/admin/orders?${qs}` : '/admin/orders'
  }

  return (
    <div className="p-8 max-w-7xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl mb-1">訂單管理</h1>
        <p className="text-ink-soft text-sm">共 {result.total} 筆</p>
      </header>

      <div className="flex flex-wrap items-start gap-4 mb-4">
        <SearchBox
          defaultValue={params.q}
          placeholder="訂單編號 / Email / 客戶姓名"
          hiddenFields={{ status: params.status }}
        />
        <Link
          href={`/admin/orders/export${params.status ? `?status=${params.status}` : ''}`}
          className="text-sm border border-line rounded-md px-3 py-1.5 hover:border-ink"
          prefetch={false}
        >
          匯出 CSV
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-line">
        <StatusChip current={params.status} value={undefined} label="全部狀態" />
        {orderStatusEnum.map((s) => (
          <StatusChip
            key={s}
            current={params.status}
            value={s}
            label={STATUS_LABEL[s]}
          />
        ))}
      </div>

      {result.rows.length === 0 ? (
        <div className="bg-white border border-line rounded-lg p-12 text-center">
          <p className="text-ink-soft">
            {params.q || params.status ? '沒有符合條件的訂單。' : '目前沒有訂單。'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-line rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 text-ink-soft">
                <tr>
                  <th className="text-left px-4 py-3 font-normal">訂單編號</th>
                  <th className="text-left px-4 py-3 font-normal">客戶</th>
                  <th className="text-left px-4 py-3 font-normal">狀態</th>
                  <th className="text-right px-4 py-3 font-normal">金額</th>
                  <th className="text-left px-4 py-3 font-normal">建立日期</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map(({ order, customer }) => (
                  <tr key={order.id} className="border-t border-line hover:bg-cream-50">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link href={`/admin/orders/${order.id}`} className="hover:text-accent">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {customer?.name ?? customer?.email ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadgeClass(order.status)}`}>
                        {STATUS_LABEL[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatTwd(order.total)}
                    </td>
                    <td className="px-4 py-3 text-ink-soft text-xs">
                      {new Date(order.createdAt).toLocaleDateString('zh-TW')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            href={buildHref}
          />
        </>
      )}
    </div>
  )
}

function StatusChip({
  current,
  value,
  label,
}: {
  current: string | undefined
  value: string | undefined
  label: string
}) {
  const active = value ? current === value : !current
  const href = value
    ? `/admin/orders?status=${encodeURIComponent(value)}`
    : '/admin/orders'
  return (
    <Link
      href={href}
      className={
        'text-xs px-3 py-1 rounded-full border transition-colors ' +
        (active
          ? 'bg-ink text-cream border-ink'
          : 'border-line text-ink-soft hover:border-ink hover:text-ink')
      }
    >
      {label}
    </Link>
  )
}
