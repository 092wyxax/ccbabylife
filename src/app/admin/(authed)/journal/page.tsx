import Link from 'next/link'
import { listAllPostsForAdmin } from '@/server/services/JournalService'

export default async function AdminJournalPage() {
  const rows = await listAllPostsForAdmin()
  return (
    <div className="p-8 max-w-5xl">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl mb-1">部落格</h1>
          <p className="text-ink-soft text-sm">共 {rows.length} 篇</p>
        </div>
        <Link
          href="/admin/journal/new"
          className="bg-ink text-cream px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors"
        >
          + 新增文章
        </Link>
      </header>

      <div className="bg-white border border-line rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream-100 text-ink-soft">
            <tr>
              <th className="text-left px-4 py-3 font-normal">標題</th>
              <th className="text-left px-4 py-3 font-normal">slug</th>
              <th className="text-left px-4 py-3 font-normal">狀態</th>
              <th className="text-left px-4 py-3 font-normal">最後更新</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-ink-soft">
                  還沒有文章，點右上「新增文章」開始。
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="border-t border-line hover:bg-cream-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/journal/${p.id}`}
                      className="hover:text-accent"
                    >
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-soft text-xs font-mono">{p.slug}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        'text-xs px-2 py-0.5 rounded-full ' +
                        (p.status === 'active'
                          ? 'bg-success/20'
                          : p.status === 'draft'
                          ? 'bg-line'
                          : 'bg-ink/10 text-ink-soft')
                      }
                    >
                      {p.status === 'active'
                        ? '已發布'
                        : p.status === 'draft'
                        ? '草稿'
                        : '已封存'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft text-xs">
                    {new Date(p.updatedAt).toLocaleDateString('zh-TW')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
