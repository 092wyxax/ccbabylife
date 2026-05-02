import { listExperimentsWithStats } from '@/server/services/ExperimentService'
import { ExperimentAddForm } from '@/components/admin/ExperimentAddForm'
import { toggleExperimentActiveAction } from '@/server/actions/experiments'

export default async function ExperimentsPage() {
  const summaries = await listExperimentsWithStats()

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl mb-1">A/B 測試</h1>
        <p className="text-ink-soft text-sm">
          內建框架：訪客以 cookie 識別，依 experiment key + variant weight 做 deterministic
          分流，pickVariant 純函式可單元測試。
        </p>
      </header>

      <section className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-6">
          <h2 className="text-xs uppercase tracking-widest text-ink-soft">
            目前 {summaries.length} 個實驗
          </h2>
          {summaries.length === 0 ? (
            <div className="bg-white border border-line rounded-lg p-12 text-center">
              <p className="text-ink-soft text-sm">尚無實驗。從右側新增。</p>
            </div>
          ) : (
            summaries.map(({ experiment, variantStats }) => (
              <article key={experiment.id} className="bg-white border border-line rounded-lg p-6">
                <header className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-serif text-lg mb-1">{experiment.name}</h3>
                    <p className="text-xs text-ink-soft font-mono">{experiment.key}</p>
                    {experiment.description && (
                      <p className="text-sm text-ink-soft mt-2">{experiment.description}</p>
                    )}
                  </div>
                  <form action={toggleExperimentActiveAction}>
                    <input type="hidden" name="id" value={experiment.id} />
                    <button
                      type="submit"
                      className={
                        'text-xs px-3 py-1 rounded-full transition-colors ' +
                        (experiment.isActive
                          ? 'bg-success/15 hover:bg-success/30 text-ink'
                          : 'bg-line text-ink-soft hover:bg-ink/20')
                      }
                    >
                      {experiment.isActive ? '進行中（點擊暫停）' : '停用（點擊啟用）'}
                    </button>
                  </form>
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
            ))
          )}
        </div>

        <aside>
          <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">新增實驗</h2>
          <ExperimentAddForm />
          <div className="mt-6 p-4 bg-cream-100 border border-line rounded-lg text-xs text-ink-soft leading-relaxed">
            <p className="font-medium text-ink mb-1">使用方式</p>
            <pre className="font-mono text-[11px] mt-2 bg-white border border-line rounded p-2 whitespace-pre-wrap">
{`const v = await getVariant('hero-cta-2026q2')
if (v?.key === 'B') return <NewHero />
return <DefaultHero />`}
            </pre>
            <p className="mt-2">
              轉換時呼叫 <code className="text-xs bg-line px-1 rounded">trackExposure(key, v.key, &apos;conversion&apos;)</code>。
            </p>
          </div>
        </aside>
      </section>
    </div>
  )
}
