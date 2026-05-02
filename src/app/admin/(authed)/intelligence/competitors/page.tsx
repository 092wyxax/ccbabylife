import Link from 'next/link'
import { listCompetitors } from '@/server/services/IntelligenceService'
import { CompetitorAddForm } from '@/components/admin/CompetitorAddForm'

export default async function CompetitorsPage() {
  const rows = await listCompetitors()

  return (
    <div className="p-8 max-w-5xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/intelligence" className="hover:text-ink">市場情報</Link>
        <span className="mx-2">/</span>
        <span>競品追蹤</span>
      </nav>

      <h1 className="font-serif text-2xl mb-1">追蹤的競品</h1>
      <p className="text-ink-soft text-sm mb-8">
        填入競品的 IG / 蝦皮 URL + 關鍵字，Phase 5 啟動後會每週自動快照、比對變動。
      </p>

      <section className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
            目前 {rows.length} 個競品
          </h2>
          {rows.length === 0 ? (
            <div className="bg-white border border-line rounded-lg p-8 text-center text-ink-soft text-sm">
              尚無競品，從右側新增。
            </div>
          ) : (
            <div className="bg-white border border-line rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-cream-100 text-ink-soft">
                  <tr>
                    <th className="text-left px-4 py-2 font-normal">名稱</th>
                    <th className="text-left px-4 py-2 font-normal">追蹤關鍵字</th>
                    <th className="text-left px-4 py-2 font-normal">平台</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id} className="border-t border-line">
                      <td className="px-4 py-3">{c.name}</td>
                      <td className="px-4 py-3 text-ink-soft text-xs">
                        {c.monitoredKeywords?.length
                          ? c.monitoredKeywords.join('、')
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs space-x-2">
                        {c.platforms?.ig && (
                          <span className="bg-line px-2 py-0.5 rounded-full">IG</span>
                        )}
                        {c.platforms?.shopee && (
                          <span className="bg-line px-2 py-0.5 rounded-full">蝦皮</span>
                        )}
                        {c.platforms?.website && (
                          <span className="bg-line px-2 py-0.5 rounded-full">官網</span>
                        )}
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
            新增競品
          </h2>
          <CompetitorAddForm />
        </aside>
      </section>
    </div>
  )
}
