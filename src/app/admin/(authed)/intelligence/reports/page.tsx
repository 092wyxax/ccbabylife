import Link from 'next/link'
import { listReports } from '@/server/services/IntelligenceService'

export default async function ReportsPage() {
  const reports = await listReports()

  return (
    <div className="p-8 max-w-4xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/intelligence" className="hover:text-ink">市場情報</Link>
        <span className="mx-2">/</span>
        <span>AI 週報</span>
      </nav>

      <h1 className="font-serif text-2xl mb-1">AI 週報</h1>
      <p className="text-ink-soft text-sm mb-8">
        每週一早上 8:00 由 Claude 產出，含趨勢摘要、進貨建議、競品變動。
      </p>

      {reports.length === 0 ? (
        <div className="bg-cream-100 border border-line rounded-lg p-8 text-sm text-ink-soft text-center">
          尚無週報。Phase 5 啟動後第一份會在週一早上 8:00 自動產生並 LINE 推送。
        </div>
      ) : (
        <ul className="space-y-6">
          {reports.map((r) => (
            <li key={r.id} className="bg-white border border-line rounded-lg p-6">
              <header className="mb-3 flex items-baseline justify-between">
                <h2 className="font-serif text-lg">
                  {new Date(r.periodStart).toLocaleDateString('zh-TW')} –{' '}
                  {new Date(r.periodEnd).toLocaleDateString('zh-TW')}
                </h2>
                <span className="text-xs text-ink-soft">
                  產出於 {new Date(r.generatedAt).toLocaleString('zh-TW')}
                </span>
              </header>
              <p className="text-sm whitespace-pre-wrap leading-relaxed text-ink/90">
                {r.summary}
              </p>
              {r.recommendations && r.recommendations.length > 0 && (
                <ul className="mt-4 pt-4 border-t border-line space-y-1 text-sm">
                  {r.recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-xs bg-line px-2 py-0.5 rounded-full whitespace-nowrap">
                        {rec.kind === 'rising'
                          ? '上升'
                          : rec.kind === 'falling'
                          ? '下降'
                          : rec.kind === 'competitor'
                          ? '競品'
                          : '庫存'}
                      </span>
                      <span>{rec.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
