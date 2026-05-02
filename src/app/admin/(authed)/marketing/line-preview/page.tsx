import Link from 'next/link'
import {
  LINE_TEMPLATES,
  SAMPLE_VARS,
  renderTemplate,
} from '@/lib/line-templates'

export default function LinePreviewPage() {
  return (
    <div className="p-8 max-w-5xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/marketing" className="hover:text-ink">行銷推播</Link>
        <span className="mx-2">/</span>
        <span>LINE 訊息預覽</span>
      </nav>

      <h1 className="font-serif text-2xl mb-1">LINE 訊息範本預覽</h1>
      <p className="text-ink-soft text-sm mb-8">
        模板來自{' '}
        <code className="text-xs bg-line px-1 py-0.5 rounded">docs/LINE_TEMPLATES.md</code>。
        以示意資料渲染，等 LINE Messaging API channel 設定完成後，每個範本都會接上實際寄送。
      </p>

      <section className="mb-8 bg-cream-100 border border-line rounded-lg p-5 text-xs leading-relaxed">
        <p className="font-medium mb-2">示意資料變數</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 text-ink-soft font-mono">
          {Object.entries(SAMPLE_VARS).slice(0, 12).map(([k, v]) => (
            <span key={k}>
              <span className="text-ink">{`{{${k}}}`}</span> = {v}
            </span>
          ))}
          <span className="text-ink-soft">⋯ 還有 {Object.keys(SAMPLE_VARS).length - 12} 個</span>
        </div>
      </section>

      <div className="space-y-8">
        {LINE_TEMPLATES.map((tmpl) => (
          <article
            key={tmpl.id}
            className="bg-white border border-line rounded-lg overflow-hidden"
          >
            <header className="px-5 py-3 bg-cream-100 border-b border-line flex items-center justify-between">
              <div>
                <h2 className="font-medium">{tmpl.triggerLabel}</h2>
                <p className="text-xs text-ink-soft mt-0.5 font-mono">{tmpl.id}</p>
              </div>
              <div className="flex gap-2">
                <span
                  className={
                    'text-xs px-2 py-0.5 rounded-full ' +
                    (tmpl.channel === 'push'
                      ? 'bg-warning/20 text-ink'
                      : 'bg-success/15 text-ink')
                  }
                >
                  {tmpl.channel === 'push' ? 'Push（計費）' : 'Reply（免費）'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-line text-ink-soft">
                  {tmpl.pricedAt}
                </span>
              </div>
            </header>

            <div className="grid lg:grid-cols-2">
              <div className="p-5 border-b lg:border-b-0 lg:border-r border-line">
                <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">
                  原始模板
                </p>
                <pre className="text-xs whitespace-pre-wrap leading-relaxed font-mono text-ink-soft">
                  {tmpl.body}
                </pre>
              </div>

              <div className="p-5 bg-[#9ec18b]/5">
                <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">
                  渲染結果（LINE 風格）
                </p>
                <div className="bg-[#7ba888] rounded-2xl rounded-tl-sm p-4 max-w-md text-cream text-sm leading-relaxed shadow-sm">
                  <pre className="whitespace-pre-wrap font-sans">
                    {renderTemplate(tmpl.body, SAMPLE_VARS)}
                  </pre>
                </div>
                {tmpl.notes && (
                  <p className="text-xs text-ink-soft mt-3 italic">{tmpl.notes}</p>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 p-5 bg-cream-100 border border-line rounded-lg text-sm">
        <p className="font-medium mb-2">下一步</p>
        <ol className="list-decimal list-inside text-ink-soft space-y-1">
          <li>申請 LINE Messaging API channel（developers.line.biz）</li>
          <li>填入 .env.local 的 <code className="text-xs">LINE_MESSAGING_*</code> 變數</li>
          <li>實作 NotificationService 把 renderTemplate + push API 串起來</li>
          <li>訂單狀態變更時自動觸發對應模板（OrderService.changeStatus 已 ready）</li>
        </ol>
      </div>
    </div>
  )
}
