import Link from 'next/link'
import { requireRole } from '@/server/services/AdminAuthService'
import {
  getLineAudienceEstimate,
  listRecentLineBroadcasts,
} from '@/server/actions/line-broadcast'
import { BroadcastForm } from './BroadcastForm'

export const dynamic = 'force-dynamic'

export default async function LineBroadcastPage() {
  await requireRole(['owner', 'manager', 'editor'])

  const [audienceEstimate, recent] = await Promise.all([
    getLineAudienceEstimate(),
    listRecentLineBroadcasts(),
  ])

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      <Link
        href="/admin/marketing"
        className="text-xs text-ink-soft hover:text-accent mb-3 inline-block"
      >
        ← 返回行銷推播
      </Link>
      <header className="mb-6">
        <h1 className="font-serif text-2xl mb-1">LINE OA 群發</h1>
        <p className="text-ink-soft text-sm">
          一次寄給所有 OA 粉絲。用於上新通知、限時優惠、品牌故事等。
        </p>
      </header>

      <section className="bg-white border border-line rounded-lg p-6 mb-8">
        <BroadcastForm audienceEstimate={audienceEstimate} />
      </section>

      <section>
        <h2 className="font-medium text-sm mb-3">最近 20 筆群發</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-ink-soft">還沒有群發紀錄。</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((r) => (
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
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed line-clamp-3">
                  {r.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
