'use client'

import { useActionState, useState } from 'react'
import {
  createSubscriptionAction,
  type SubscriptionState,
} from '@/server/actions/subscriptions'
import { toast } from '@/components/shared/Toast'

const initial: SubscriptionState = {}

const FREQUENCIES = [
  { value: 'monthly', label: '每月' },
  { value: 'bimonthly', label: '每兩個月' },
  { value: 'quarterly', label: '每三個月' },
] as const

interface Props {
  productId: string
  isLoggedIn: boolean
}

/**
 * Compact subscribe widget on PDP — opens an inline panel with frequency
 * selector + quantity, then submits to create a subscription.
 */
export function SubscribeButton({ productId, isLoggedIn }: Props) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(
    createSubscriptionAction,
    initial
  )

  if (state.success) {
    toast.success(state.success, 2500)
    if (open) setOpen(false)
  }

  if (!isLoggedIn) {
    return (
      <a
        href="/account"
        className="block w-full text-center text-sm border border-dashed border-line px-4 py-3 rounded-md text-ink-soft hover:border-ink hover:text-ink transition-colors"
      >
        登入後可訂閱定期配送
      </a>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full text-center text-sm border border-line px-4 py-3 rounded-md hover:border-ink transition-colors"
      >
        ↻ 改為定期配送（可隨時取消）
      </button>
    )
  }

  return (
    <form
      action={formAction}
      className="border border-line rounded-md p-4 space-y-3 bg-cream-100"
    >
      <input type="hidden" name="productId" value={productId} />

      <div>
        <label htmlFor="sub-freq" className="block text-xs text-ink-soft mb-1.5">
          配送頻率
        </label>
        <select
          id="sub-freq"
          name="frequency"
          defaultValue="monthly"
          className="w-full border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-ink bg-white"
        >
          {FREQUENCIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="sub-qty" className="block text-xs text-ink-soft mb-1.5">
          每次配送數量
        </label>
        <input
          id="sub-qty"
          name="quantity"
          type="number"
          min="1"
          max="20"
          defaultValue="1"
          className="w-24 border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-ink bg-white"
        />
      </div>

      {state.error && (
        <p className="text-xs text-danger">{state.error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 font-jp text-sm bg-ink text-cream py-2 rounded-md hover:bg-accent disabled:opacity-50 tracking-wider"
        >
          {pending ? '建立中⋯' : '確認訂閱'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-ink-soft hover:text-ink underline"
        >
          取消
        </button>
      </div>

      <p className="text-[11px] text-ink-soft leading-relaxed">
        💡 訂閱後系統會自動下單，每次寄付款連結到你的 LINE / Email。
        可隨時到「我的訂閱」暫停或取消。
      </p>
    </form>
  )
}
