'use client'

import { useState, useTransition } from 'react'
import { Sparkles } from 'lucide-react'
import { sendReplyAction, draftReplyAction } from '@/server/actions/line-inbox'

export function ReplyBox({ lineUserId }: { lineUserId: string }) {
  const [text, setText] = useState('')
  const [drafting, startDraft] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDraft() {
    setError(null)
    startDraft(async () => {
      const result = await draftReplyAction(lineUserId)
      if (result.text) setText(result.text)
      else setError(result.error ?? 'AI 草擬失敗')
    })
  }

  return (
    <div>
      <form
        action={sendReplyAction}
        className="bg-white border border-line rounded-lg p-3 flex gap-2"
      >
        <input type="hidden" name="lineUserId" value={lineUserId} />
        <textarea
          name="text"
          required
          rows={3}
          maxLength={2000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="輸入回覆訊息⋯ 或按右下角「AI 草擬」讓 AI 先寫一版"
          className="flex-1 border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-ink resize-none"
        />
        <div className="flex flex-col gap-2 self-end">
          <button
            type="button"
            onClick={handleDraft}
            disabled={drafting}
            className="font-jp inline-flex items-center gap-1 border border-line px-3 py-2 rounded-md hover:border-ink text-xs tracking-wider disabled:opacity-50"
          >
            <Sparkles size={13} />
            {drafting ? '草擬中⋯' : 'AI 草擬'}
          </button>
          <button
            type="submit"
            className="font-jp bg-ink text-cream px-3 py-2 rounded-md hover:bg-accent text-sm tracking-wider"
          >
            送出
          </button>
        </div>
      </form>
      {error && <p className="text-xs text-danger mt-2">{error}</p>}
      <p className="text-xs text-ink-soft mt-2">
        💡 AI 草擬會參考對話脈絡與客戶訂單狀態，送出前請過目修改。
      </p>
    </div>
  )
}
