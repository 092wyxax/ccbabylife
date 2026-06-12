'use client'

import { useActionState } from 'react'
import {
  updateAiNotesAction,
  type AiNotesState,
} from '@/server/actions/store-settings'

const initialState: AiNotesState = {}

const PLACEHOLDER = `寫下想讓 AI 記住的事，一行一件，例如：

- 公司名稱：宅智安防科技有限公司（統編 60766849），品牌叫「熙熙初日」
- 出貨節奏：預購商品每週四截單、約 10–14 天到貨
- 退換貨：商品到貨 7 天內可退，貼身衣物拆封後不退
- 客服口吻：稱呼客人「媽咪」，結尾常用 🌸
- 免運門檻滿 NT$2,000，超商取貨運費 NT$60`

export function AiNotesForm({ aiNotes }: { aiNotes: string | null }) {
  const [state, formAction, pending] = useActionState(
    updateAiNotesAction,
    initialState
  )

  return (
    <form action={formAction} className="space-y-4">
      <textarea
        name="aiNotes"
        rows={14}
        maxLength={6000}
        defaultValue={aiNotes ?? ''}
        placeholder={PLACEHOLDER}
        className="w-full border border-line rounded-md px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:border-ink"
      />

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          ✓ {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="font-jp bg-ink text-cream px-6 py-2.5 rounded-md hover:bg-accent text-sm tracking-wider disabled:opacity-50"
      >
        {pending ? '儲存中⋯' : '儲存備忘'}
      </button>
    </form>
  )
}
