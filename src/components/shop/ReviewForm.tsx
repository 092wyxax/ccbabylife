'use client'

import { useState, useActionState } from 'react'
import { useActionToast } from '@/hooks/useActionToast'
import {
  writeReviewAction,
  type WriteReviewState,
} from '@/server/actions/reviews'

const initial: WriteReviewState = {}

interface Props {
  productId: string
  isLoggedIn: boolean
}

export function ReviewForm({ productId, isLoggedIn }: Props) {
  const [state, formAction, pending] = useActionState(writeReviewAction, initial)
  useActionToast(state)
  const [rating, setRating] = useState(5)

  if (!isLoggedIn) {
    return (
      <p className="text-sm text-ink-soft">
        登入會員後才能寫心得。
      </p>
    )
  }

  if (state.success) {
    return (
      <div className="bg-success/15 border border-success/40 text-ink rounded-md p-4 text-sm">
        {state.success}
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />

      <div>
        <span className="block text-sm mb-1.5 font-jp">評価 · 評分</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className="text-2xl hover:scale-110 transition-transform"
              aria-label={`${n} 顆星`}
            >
              {n <= rating ? '★' : '☆'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm mb-1.5 font-jp">
          タイトル · 標題（選填）
        </label>
        <input
          id="title"
          name="title"
          maxLength={80}
          className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm mb-1.5 font-jp">
          ご感想 · 心得 <span className="text-danger">*</span>
        </label>
        <textarea
          id="body"
          name="body"
          rows={5}
          required
          minLength={5}
          placeholder="實際使用感想；我們會審核後公開顯示。"
          className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-ink text-cream px-5 py-2 rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50"
      >
        {pending ? '送信中・・・' : '送出心得'}
      </button>
    </form>
  )
}
