import Link from 'next/link'
import { listInboxThreads } from '@/server/services/LineInboxService'
import { requireRole } from '@/server/services/AdminAuthService'

export const dynamic = 'force-dynamic'

export default async function InboxPage() {
  await requireRole(['owner', 'manager', 'ops'])
  const threads = await listInboxThreads(100)

  const totalUnread = threads.reduce((s, t) => s + t.unreadCount, 0)

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl mb-1">LINE 客服收件匣</h1>
        <p className="text-ink-soft text-sm">
          OA 好友傳給你的訊息會出現在這裡
          {totalUnread > 0 && (
            <span className="ml-2 bg-accent text-cream text-xs px-2 py-0.5 rounded-full">
              {totalUnread} 則未讀
            </span>
          )}
        </p>
      </header>

      {threads.length === 0 ? (
        <div className="bg-white border border-line border-dashed rounded-lg p-12 text-center text-ink-soft text-sm">
          尚無訊息。等 OA 好友私訊你後會出現在這裡。
          <p className="text-xs mt-3">
            記得到 LINE Developers Console 把 Webhook URL 設為 <code className="font-mono">/api/line/webhook</code>，並開啟「Use webhook」。
          </p>
        </div>
      ) : (
        <ul className="bg-white border border-line rounded-lg divide-y divide-line">
          {threads.map((t) => (
            <li key={t.lineUserId}>
              <Link
                href={`/admin/inbox/${encodeURIComponent(t.lineUserId)}`}
                className="block px-5 py-4 hover:bg-cream-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {t.customerName ?? '未綁定 LINE 用戶'}
                      {t.customerEmail && (
                        <span className="ml-2 text-ink-soft text-xs">{t.customerEmail}</span>
                      )}
                    </p>
                    <p className="text-xs text-ink-soft truncate mt-1">
                      {t.lastDirection === 'out' && '↳ '}
                      {t.lastMessage}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-ink-soft">
                      {new Date(t.lastAt).toLocaleString('zh-TW', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {t.unreadCount > 0 && (
                      <span className="inline-block mt-1 bg-accent text-cream text-[10px] min-w-[18px] px-1.5 rounded-full">
                        {t.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-ink-soft mt-4">
        💡 設定 webhook：LINE Developers Console → Messaging API channel → Webhook URL → 填{' '}
        <code className="font-mono">{process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ccbabylife.com'}/api/line/webhook</code>
        {' '}→ Verify → 開啟 Use webhook
      </p>
    </div>
  )
}
