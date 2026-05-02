import Link from 'next/link'
import {
  getIntelligenceOverview,
  getPipelineStatus,
} from '@/server/services/IntelligenceService'

export default async function IntelligenceIndexPage() {
  const [overview, pipeline] = await Promise.all([
    getIntelligenceOverview(),
    getPipelineStatus(),
  ])

  const cards = [
    { label: '原始爬蟲資料', value: overview.rawPostCount, href: '/admin/intelligence/trends' },
    { label: '已清理筆數', value: overview.cleanedCount, href: '/admin/intelligence/trends' },
    { label: '趨勢關鍵字', value: overview.trendCount, href: '/admin/intelligence/trends' },
    { label: '追蹤的競品', value: overview.competitorCount, href: '/admin/intelligence/competitors' },
    { label: 'AI 週報數量', value: overview.reportCount, href: '/admin/intelligence/reports' },
  ]

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="font-serif text-2xl mb-1">市場情報</h1>
      <p className="text-ink-soft text-sm mb-8">
        Phase 5 規劃：每日爬 PTT / Dcard / 蝦皮 / Google Trends，Claude 清理、產出
        週報與進貨建議。資料表已建好，等 Cloudflare Workers + Anthropic key 接上後啟動。
      </p>

      <section className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="bg-white border border-line rounded-lg p-4 hover:border-ink transition-colors"
          >
            <p className="text-xs uppercase tracking-widest text-ink-soft mb-1">
              {c.label}
            </p>
            <p className="text-2xl font-medium">{c.value}</p>
          </Link>
        ))}
      </section>

      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
          資料來源管線狀態
        </h2>
        <div className="bg-white border border-line rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-ink-soft">
              <tr>
                <th className="text-left px-4 py-2 font-normal">來源</th>
                <th className="text-left px-4 py-2 font-normal">最後抓取</th>
                <th className="text-right px-4 py-2 font-normal">過去 7 天</th>
                <th className="text-left px-4 py-2 font-normal">狀態</th>
              </tr>
            </thead>
            <tbody>
              {pipeline.scrapers.map((s) => (
                <tr key={s.source} className="border-t border-line">
                  <td className="px-4 py-2 font-mono text-xs">{s.source}</td>
                  <td className="px-4 py-2 text-ink-soft text-xs">
                    {s.lastRun ? new Date(s.lastRun).toLocaleString('zh-TW') : '從未'}
                  </td>
                  <td className="px-4 py-2 text-right text-ink-soft">{s.recentCount}</td>
                  <td className="px-4 py-2">
                    {s.lastRun ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-success/15 text-ink">
                        運作中
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-line text-ink-soft">
                        未啟動
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-cream-100 border border-line rounded-lg p-6 text-sm leading-relaxed">
        <p className="font-medium mb-3">Phase 5 串接清單（依序）</p>
        <ol className="list-decimal list-inside space-y-1 text-ink-soft">
          <li>
            填 <code className="text-xs bg-line px-1 rounded">ANTHROPIC_API_KEY</code> 與
            <code className="text-xs bg-line px-1 rounded ml-1">OPENAI_API_KEY</code>（.env.local）
          </li>
          <li>建 Cloudflare Workers + Cron Triggers，將 workers/scrapers 部署</li>
          <li>朋友 / 太太 在 /admin/intelligence/competitors 列追蹤對手</li>
          <li>每日凌晨 03:00 爬蟲跑，寫入 raw_posts</li>
          <li>同 worker 進程內呼叫 Claude 清理、寫 cleaned_data</li>
          <li>聚合到 trends 表（依日 / 週）</li>
          <li>每週一早上 8:00 cron 產生 intelligence_reports + LINE 推給先生</li>
          <li>後台儀表板以即時 query 顯示</li>
        </ol>
        <p className="text-xs text-ink-soft mt-4">
          完整設計見{' '}
          <code className="text-xs bg-line px-1 rounded">docs/INTELLIGENCE.md</code>。
        </p>
      </section>
    </div>
  )
}
