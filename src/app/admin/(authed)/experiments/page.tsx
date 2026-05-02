import Link from 'next/link'
import { listExperimentsWithStats } from '@/server/services/ExperimentService'

export default async function ExperimentsPage() {
  const summaries = await listExperimentsWithStats()

  return (
    <div className="p-8 max-w-5xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl mb-1">A/B 測試</h1>
        <p className="text-ink-soft text-sm">
          內建框架：訪客以 cookie 識別，依 experiment key + variant weight 做 deterministic
          分流，pickVariant 純函式可單元測試。
        </p>
      </header>

      {summaries.length === 0 ? (
        <div className="bg-white border border-line rounded-lg p-12 text-center">
          <p className="text-ink-soft mb-2">尚無實驗。</p>
          <p className="text-xs text-ink-soft leading-relaxed">
            目前以 SQL 直接維運（INSERT INTO experiments）。<br />
            UI 建立 / 編輯之後 Phase 再做。
            <br />
            <br />
            <strong>使用方式</strong>：
            <code className="text-xs bg-line px-1 mx-1 rounded">
              const v = await getVariant(&apos;hero-cta-2026q2&apos;)
            </code>
            ，依 v.key 渲染不同 UI；轉換時呼叫
            <code className="text-xs bg-line px-1 mx-1 rounded">
              trackExposure(key, v.key, &apos;conversion&apos;)
            </code>。
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {summaries.map(({ experiment, variantStats }) => (
            <article
              key={experiment.id}
              className="bg-white border border-line rounded-lg p-6"
            >
              <header className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-serif text-lg mb-1">{experiment.name}</h2>
                  <p className="text-xs text-ink-soft font-mono">{experiment.key}</p>
                  {experiment.description && (
                    <p className="text-sm text-ink-soft mt-2">{experiment.description}</p>
                  )}
                </div>
                <span
                  className={
                    'text-xs px-2 py-0.5 rounded-full ' +
                    (experiment.isActive
                      ? 'bg-success/15 text-ink'
                      : 'bg-line text-ink-soft')
                  }
                >
                  {experiment.isActive ? '進行中' : '停用'}
                </span>
              </header>

              <table className="w-full text-sm border-collapse border border-line">
                <thead className="bg-cream-100 text-ink-soft">
                  <tr>
                    <th className="text-left p-2 border border-line">變體</th>
                    <th className="text-right p-2 border border-line">權重</th>
                    <th className="text-right p-2 border border-line">曝光</th>
                    <th className="text-right p-2 border border-line">轉換</th>
                    <th className="text-right p-2 border border-line">CVR</th>
                  </tr>
                </thead>
                <tbody>
                  {experiment.variants?.map((v) => {
                    const stat = variantStats.find((s) => s.variantKey === v.key)
                    return (
                      <tr key={v.key}>
                        <td className="p-2 border border-line">
                          <p className="font-mono text-xs">{v.key}</p>
                          <p className="text-xs text-ink-soft">{v.label}</p>
                        </td>
                        <td className="p-2 border border-line text-right">{v.weight}</td>
                        <td className="p-2 border border-line text-right">{stat?.exposures ?? 0}</td>
                        <td className="p-2 border border-line text-right">{stat?.conversions ?? 0}</td>
                        <td className="p-2 border border-line text-right font-medium">
                          {stat ? `${(stat.cvr * 100).toFixed(2)}%` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
