import Link from 'next/link'
import { listAuditLogs } from '@/server/services/AuditService'
import { parsePage } from '@/lib/pagination'
import { Pagination, SearchBox } from '@/components/admin/Pagination'

const ENTITY_TYPES = ['product', 'order', 'customer', 'purchase', 'post']

interface Props {
  searchParams: Promise<{ q?: string; entityType?: string; page?: string }>
}

const ACTION_LABEL: Record<string, string> = {
  'inventory.set_stock': '庫存設定',
  'order.status.change': '訂單狀態變更',
  'customer.blacklist.add': '加入黑名單',
  'customer.blacklist.remove': '取消黑名單',
  'customer.store_credit.adjust': '購物金調整',
}

export default async function AuditLogsPage({ searchParams }: Props) {
  const params = await searchParams
  const result = await listAuditLogs({
    search: params.q,
    entityType: params.entityType,
    page: parsePage(params.page),
  })

  const buildHref = (p: number) => {
    const usp = new URLSearchParams()
    if (params.q) usp.set('q', params.q)
    if (params.entityType) usp.set('entityType', params.entityType)
    if (p > 1) usp.set('page', String(p))
    const qs = usp.toString()
    return qs ? `/admin/audit-logs?${qs}` : '/admin/audit-logs'
  }

  return (
    <div className="p-8 max-w-7xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl mb-1">稽核紀錄</h1>
        <p className="text-ink-soft text-sm">
          所有後台寫入動作都會記錄。共 {result.total} 筆
        </p>
      </header>

      <SearchBox
        defaultValue={params.q}
        placeholder="action / entity / 操作者"
        hiddenFields={{ entityType: params.entityType }}
      />

      <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-line">
        <Chip current={params.entityType} value={undefined} label="全部 entity" />
        {ENTITY_TYPES.map((e) => (
          <Chip key={e} current={params.entityType} value={e} label={e} />
        ))}
      </div>

      {result.rows.length === 0 ? (
        <div className="bg-white border border-line rounded-lg p-12 text-center text-ink-soft">
          沒有符合條件的稽核紀錄。
        </div>
      ) : (
        <>
          <div className="bg-white border border-line rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 text-ink-soft">
                <tr>
                  <th className="text-left px-4 py-3 font-normal w-44">時間</th>
                  <th className="text-left px-4 py-3 font-normal">動作</th>
                  <th className="text-left px-4 py-3 font-normal">Entity</th>
                  <th className="text-left px-4 py-3 font-normal">操作者</th>
                  <th className="text-left px-4 py-3 font-normal">細節</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((log) => (
                  <tr key={log.id} className="border-t border-line align-top">
                    <td className="px-4 py-2 text-xs text-ink-soft whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('zh-TW')}
                    </td>
                    <td className="px-4 py-2">
                      <p className="font-mono text-xs">{log.action}</p>
                      <p className="text-xs text-ink-soft mt-0.5">
                        {ACTION_LABEL[log.action] ?? ''}
                      </p>
                    </td>
                    <td className="px-4 py-2">
                      <p className="text-xs">{log.entityType}</p>
                      {log.entityId && (
                        <p className="text-xs font-mono text-ink-soft mt-0.5">
                          {log.entityId.slice(0, 8)}…
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <p>{log.actorLabel ?? '—'}</p>
                      <p className="text-ink-soft">{log.actorType}</p>
                    </td>
                    <td className="px-4 py-2 text-xs text-ink-soft">
                      <pre className="font-mono text-[11px] whitespace-pre-wrap break-words max-w-md">
                        {log.data ? JSON.stringify(log.data, null, 0) : '—'}
                      </pre>
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

function Chip({
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
    ? `/admin/audit-logs?entityType=${encodeURIComponent(value)}`
    : '/admin/audit-logs'
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
