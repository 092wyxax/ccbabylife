import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getThreadMessages,
  markThreadRead,
  getCustomerByLineUserId,
} from '@/server/services/LineInboxService'
import { sendReplyAction } from '@/server/actions/line-inbox'
import { requireRole } from '@/server/services/AdminAuthService'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ lineUserId: string }>
}

export default async function InboxThreadPage({ params }: Props) {
  await requireRole(['owner', 'manager', 'ops'])
  const { lineUserId: rawId } = await params
  const lineUserId = decodeURIComponent(rawId)

  const messages = await getThreadMessages(lineUserId, 200)
  if (messages.length === 0) notFound()

  // Mark as read on entry
  await markThreadRead(lineUserId)

  const customer = await getCustomerByLineUserId(lineUserId)

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/inbox" className="hover:text-ink">← 收件匣</Link>
      </nav>

      <header className="mb-6 pb-4 border-b border-line">
        <h1 className="font-serif text-xl">
          {customer?.name ?? '未綁定 LINE 用戶'}
        </h1>
        <p className="text-xs text-ink-soft mt-1 font-mono break-all">
          {customer?.email ? `${customer.email} · ` : ''}
          LINE userId: {lineUserId}
        </p>
        {customer && (
          <Link
            href={`/admin/customers/${customer.id}`}
            className="inline-block mt-2 text-xs underline text-ink-soft hover:text-accent"
          >
            查看客戶詳細
          </Link>
        )}
      </header>

      <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto pr-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.direction === 'out' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={
                'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ' +
                (m.direction === 'out'
                  ? 'bg-ink text-cream rounded-br-md'
                  : 'bg-cream-100 text-ink rounded-bl-md')
              }
            >
              {m.text}
              <p
                className={
                  'text-[10px] mt-1.5 ' +
                  (m.direction === 'out' ? 'text-cream/60' : 'text-ink-soft')
                }
              >
                {new Date(m.createdAt).toLocaleString('zh-TW', {
                  hour: '2-digit',
                  minute: '2-digit',
                  month: '2-digit',
                  day: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      <form
        action={sendReplyAction}
        className="bg-white border border-line rounded-lg p-3 flex gap-2"
      >
        <input type="hidden" name="lineUserId" value={lineUserId} />
        <textarea
          name="text"
          required
          rows={2}
          maxLength={2000}
          placeholder="輸入回覆訊息⋯"
          className="flex-1 border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-ink resize-none"
        />
        <button
          type="submit"
          className="font-jp self-end bg-ink text-cream px-4 py-2.5 rounded-md hover:bg-accent text-sm tracking-wider"
        >
          送出
        </button>
      </form>

      <p className="text-xs text-ink-soft mt-3">
        💡 LINE Push API 每個收件人 1 push 額度 / 訊息。免費方案每月 200 push 上限。
      </p>
    </div>
  )
}
