import Link from 'next/link'
import { listTopTrends } from '@/server/services/IntelligenceService'

export default async function TrendsPage() {
  const trends = await listTopTrends(50)

  return (
    <div className="p-8 max-w-5xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/intelligence" className="hover:text-ink">市場情報</Link>
        <span className="mx-2">/</span>
        <span>趨勢</span>
      </nav>

      <h1 className="font-serif text-2xl mb-1">趨勢關鍵字</h1>
      <p className="text-ink-soft text-sm mb-8">
        依「上週 vs 本週」比對，列出提及量上升最多的關鍵字。
      </p>

      {trends.length === 0 ? (
        <div className="bg-cream-100 border border-line rounded-lg p-8 text-sm text-ink-soft text-center">
          尚無趨勢資料。Phase 5 爬蟲啟動後此頁會自動填入。
        </div>
      ) : (
        <div className="bg-white border border-line rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-ink-soft">
              <tr>
                <th className="text-left px-4 py-2 font-normal">關鍵字</th>
                <th className="text-left px-4 py-2 font-normal">期間</th>
                <th className="text-left px-4 py-2 font-normal">來源</th>
                <th className="text-right px-4 py-2 font-normal">提及量</th>
                <th className="text-right px-4 py-2 font-normal">變動</th>
              </tr>
            </thead>
            <tbody>
              {trends.map((t) => (
                <tr key={t.id} className="border-t border-line">
                  <td className="px-4 py-2">{t.keyword}</td>
                  <td className="px-4 py-2 text-ink-soft text-xs">
                    {t.period} · {new Date(t.periodStart).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="px-4 py-2 text-ink-soft text-xs">{t.source ?? '—'}</td>
                  <td className="px-4 py-2 text-right">{t.mentionCount}</td>
                  <td className="px-4 py-2 text-right">
                    {t.changePct != null ? (
                      <span
                        className={
                          t.changePct > 20
                            ? 'text-success font-medium'
                            : t.changePct < -20
                            ? 'text-danger'
                            : 'text-ink-soft'
                        }
                      >
                        {t.changePct > 0 ? '+' : ''}{t.changePct}%
                      </span>
                    ) : (
                      <span className="text-ink-soft">—</span>
                    )}
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
