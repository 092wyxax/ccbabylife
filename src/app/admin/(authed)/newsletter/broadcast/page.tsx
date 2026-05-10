import Link from 'next/link'
import { requireRole } from '@/server/services/AdminAuthService'
import {
  getEmailAudienceCount,
  listRecentEmailBroadcasts,
} from '@/server/actions/email-broadcast'
import { EmailBroadcastForm } from './EmailBroadcastForm'

export const dynamic = 'force-dynamic'

export default async function NewsletterBroadcastPage() {
  await requireRole(['owner', 'manager', 'editor'])

  const [audienceCount, recent] = await Promise.all([
    getEmailAudienceCount(),
    listRecentEmailBroadcasts(),
  ])

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      <Link
        href="/admin/newsletter"
        className="text-xs text-ink-soft hover:text-accent mb-3 inline-block"
      >
        ← 返回電子報
      </Link>
      <header className="mb-6">
        <h1 className="font-serif text-2xl mb-1">電子報群發</h1>
        <p className="text-ink-soft text-sm">
          一次寄給 {audienceCount} 位訂閱者。建議每月 2–3 則。
        </p>
      </header>

      <section className="bg-white border border-line rounded-lg p-6 mb-8">
        <EmailBroadcastForm audienceCount={audienceCount} />
      </section>

      <section>
        <h2 className="font-medium text-sm mb-3">最近 20 筆群發</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-ink-soft">還沒有群發紀錄。</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((r) => {
              const sentInfo =
                r.payload && typeof r.payload === 'object'
                  ? (r.payload as { sentCount?: number; audienceCount?: number })
                  : null
              return (
                <li
                  key={r.id}
                  className="bg-white border border-line rounded-md p-3"
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-[11px] text-ink-soft tabular-nums">
                      {r.sentAt
                        ? new Date(r.sentAt).toLocaleString('zh-Hant')
                        : '—'}
                    </span>
                    <span
                      className={`text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded ${
                        r.status === 'sent'
                          ? 'bg-sage-soft/40 text-sage'
                          : 'bg-danger/15 text-danger'
                      }`}
                    >
                      {r.status}
                      {sentInfo?.sentCount != null &&
                        ` ${sentInfo.sentCount}/${sentInfo.audienceCount ?? '?'}`}
                    </span>
                  </div>
                  {r.subject && (
                    <p className="text-sm font-medium mb-0.5">{r.subject}</p>
                  )}
                  <p className="text-xs whitespace-pre-wrap leading-relaxed line-clamp-2 text-ink-soft">
                    {r.body}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
