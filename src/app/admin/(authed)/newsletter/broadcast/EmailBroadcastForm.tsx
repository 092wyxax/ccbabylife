'use client'

import { useActionState, useState } from 'react'
import {
  sendEmailBroadcastAction,
  type EmailBroadcastResult,
} from '@/server/actions/email-broadcast'

const initialState: EmailBroadcastResult = {}

export function EmailBroadcastForm({
  audienceCount,
}: {
  audienceCount: number
}) {
  const [state, formAction, pending] = useActionState(
    sendEmailBroadcastAction,
    initialState
  )
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [confirming, setConfirming] = useState(false)

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-xs text-ink-soft mb-1.5">主旨</label>
        <input
          name="subject"
          type="text"
          required
          minLength={3}
          maxLength={200}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="例：本週新到貨 3 件"
          className="w-full border border-line rounded-md px-3 py-2 text-sm bg-white"
        />
      </div>

      <div>
        <label className="block text-xs text-ink-soft mb-1.5">
          內文（純文字，空行 = 段落）
        </label>
        <textarea
          name="body"
          rows={12}
          required
          minLength={10}
          maxLength={20000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`妳好～\n\n本週新到貨：\n・MikiHouse First 包屁衣（80cm）\n・MARLMARL Bouquet 圍兜\n\n截單時間：本週日 23:59\n\n看看：https://ccbabylife.com/shop`}
          className="w-full border border-line rounded-md px-3 py-2 text-sm bg-white font-mono"
        />
        <p className="text-[11px] text-ink-soft mt-1 tabular-nums">
          {body.length} 字元
        </p>
      </div>

      <div className="bg-warning/10 border border-warning/30 rounded-md p-3 text-xs leading-relaxed">
        <p className="font-medium mb-1">📧 寄送注意事項</p>
        <ul className="list-disc list-inside space-y-0.5 text-ink-soft">
          <li>每月最多 2–3 則，過量訂閱者會直接取消</li>
          <li>會自動加上「取消訂閱」連結（合規）</li>
          <li>純文字格式，空行代表段落分隔</li>
          <li>若有大量送失敗，請到 Resend dashboard 查看</li>
        </ul>
      </div>

      {!confirming ? (
        <button
          type="button"
          onClick={() => {
            if (subject.trim().length < 3 || body.trim().length < 10) return
            setConfirming(true)
          }}
          disabled={subject.trim().length < 3 || body.trim().length < 10}
          className="bg-ink text-cream px-5 py-2.5 rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50"
        >
          下一步：確認寄送
        </button>
      ) : (
        <div className="bg-cream-100 border border-line rounded-md p-4 space-y-3">
          <p className="text-sm">
            即將寄送給 <strong>{audienceCount}</strong> 位電子報訂閱者。
          </p>
          <input type="hidden" name="confirmCount" value={audienceCount} />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="bg-danger text-cream px-5 py-2 rounded-md text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {pending ? '寄送中⋯' : '✓ 確認寄送'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="border border-line px-5 py-2 rounded-md text-sm hover:border-ink transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {state?.error && (
        <p className="text-sm text-danger bg-danger/10 px-3 py-2 rounded-md">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="text-sm text-sage bg-sage-soft/40 px-3 py-2 rounded-md">
          ✓ 已寄送（{state.sentCount}/{state.audienceCount} 成功）
        </p>
      )}
    </form>
  )
}
