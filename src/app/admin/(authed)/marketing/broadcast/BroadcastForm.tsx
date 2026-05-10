'use client'

import { useActionState, useState } from 'react'
import {
  sendLineBroadcastAction,
  type LineBroadcastResult,
} from '@/server/actions/line-broadcast'

const initialState: LineBroadcastResult = {}

export function BroadcastForm({ audienceEstimate }: { audienceEstimate: number }) {
  const [state, formAction, pending] = useActionState(
    sendLineBroadcastAction,
    initialState
  )
  const [body, setBody] = useState('')
  const [confirming, setConfirming] = useState(false)

  // Once successful, reset confirming flag for next send
  if (state?.ok && confirming) {
    // do nothing — user can manually clear
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-xs text-ink-soft mb-1.5">
          訊息內容（最多 5000 字，建議 200 字內）
        </label>
        <textarea
          name="body"
          rows={8}
          required
          minLength={5}
          maxLength={5000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`例：本週新到貨 3 件 ✨\n\n・MikiHouse First 包屁衣（80cm）\n・MARLMARL Bouquet 圍兜\n・無印木琴\n\n看完整：https://ccbabylife.com/shop`}
          className="w-full border border-line rounded-md px-3 py-2 text-sm bg-white font-mono"
        />
        <p className="text-[11px] text-ink-soft mt-1 tabular-nums">
          {body.length} 字元
        </p>
      </div>

      <div className="bg-warning/10 border border-warning/30 rounded-md p-3 text-xs leading-relaxed">
        <p className="font-medium mb-1">⚠️ 群發注意事項（PLAYBOOK §8）</p>
        <ul className="list-disc list-inside space-y-0.5 text-ink-soft">
          <li>每週最多 1–2 則，過量會被封鎖（封鎖率 &gt; 25% 警戒）</li>
          <li>本次將寄給 LINE OA <strong>所有粉絲</strong>（不只系統內客戶）</li>
          <li>LINE 中用量方案 NT$1,200/月含 3,000 則訊息額度</li>
          <li>送出後無法撤回</li>
        </ul>
      </div>

      {!confirming ? (
        <button
          type="button"
          onClick={() => {
            if (body.trim().length < 5) return
            setConfirming(true)
          }}
          disabled={body.trim().length < 5}
          className="bg-ink text-cream px-5 py-2.5 rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50"
        >
          下一步：確認送出
        </button>
      ) : (
        <div className="bg-cream-100 border border-line rounded-md p-4 space-y-3">
          <p className="text-sm">
            即將送給 <strong>所有 OA 粉絲</strong>
            （已連結 LINE 的系統客戶 ≈ <strong>{audienceEstimate}</strong> 人；
            含未註冊粉絲）。
          </p>
          <input type="hidden" name="confirmCount" value={audienceEstimate} />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="bg-danger text-cream px-5 py-2 rounded-md text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {pending ? '送出中⋯' : '✓ 確認送出（無法撤回）'}
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
          ✓ 已送出（{state.sentAt ? new Date(state.sentAt).toLocaleString('zh-Hant') : ''}）
        </p>
      )}
    </form>
  )
}
