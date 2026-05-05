import Link from 'next/link'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { sources, type Source } from '@/db/schema/sources'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireRole } from '@/server/services/AdminAuthService'

export const dynamic = 'force-dynamic'

const TYPE_LABEL: Record<Source['type'], string> = {
  platform: '平台',
  brand: '品牌官網',
  chain: '連鎖店',
  resale: '二手平台',
  other: '其他',
}

const STATUS_LABEL: Record<Source['status'], { label: string; color: string }> = {
  active: { label: '常用', color: 'bg-success/20 text-success' },
  paused: { label: '暫停', color: 'bg-ink-soft/20 text-ink-soft' },
  dropped: { label: '不再使用', color: 'bg-danger/15 text-danger' },
}

export default async function AdminSourcesPage() {
  await requireRole(['owner', 'manager', 'buyer'])

  const rows = await db
    .select()
    .from(sources)
    .where(eq(sources.orgId, DEFAULT_ORG_ID))
    .orderBy(desc(sources.rating), desc(sources.lastOrderedAt), desc(sources.updatedAt))

  return (
    <div className="p-6 sm:p-8 max-w-6xl">
      <header className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-serif text-2xl mb-1">進貨來源</h1>
          <p className="text-ink-soft text-sm">
            日本端代購可用的網站、官網、連鎖店清單。內部紀錄，不對外公開。
          </p>
        </div>
        <Link
          href="/admin/sources/new"
          className="bg-ink text-cream px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors whitespace-nowrap"
        >
          + 新增來源
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="bg-white border border-line rounded-lg p-12 text-center">
          <p className="text-ink-soft text-sm mb-4">還沒有進貨來源紀錄。</p>
          <Link
            href="/admin/sources/new"
            className="text-sm text-accent hover:underline"
          >
            新增第一個來源 →
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-line rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 border-b border-line text-xs text-ink-soft uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-medium">名稱</th>
                <th className="text-left px-4 py-3 font-medium">類型</th>
                <th className="text-left px-4 py-3 font-medium">強項</th>
                <th className="text-left px-4 py-3 font-medium">評分</th>
                <th className="text-left px-4 py-3 font-medium">狀態</th>
                <th className="text-right px-4 py-3 font-medium">最後叫貨</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const status = STATUS_LABEL[s.status]
                return (
                  <tr
                    key={s.id}
                    className="border-b border-line last:border-0 hover:bg-cream-50/50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/sources/${s.id}`}
                        className="font-medium hover:text-accent block"
                      >
                        {s.name}
                      </Link>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-ink-soft hover:text-accent truncate block max-w-[260px]"
                      >
                        {s.url} ↗
                      </a>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {TYPE_LABEL[s.type]}
                    </td>
                    <td className="px-4 py-3 text-ink-soft max-w-xs">
                      <span className="line-clamp-2 text-xs">
                        {s.strengths || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {s.rating ? '★'.repeat(s.rating) + '☆'.repeat(5 - s.rating) : <span className="text-ink-soft text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-ink-soft whitespace-nowrap">
                      {s.lastOrderedAt
                        ? new Date(s.lastOrderedAt).toLocaleDateString('zh-Hant')
                        : '—'}
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
