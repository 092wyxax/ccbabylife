'use client'

import { useActionState } from 'react'
import { useActionToast } from '@/hooks/useActionToast'
import {
  subscribeRestockAction,
  type RestockState,
} from '@/server/actions/restock'
import { Turnstile } from '@/components/shared/Turnstile'

const initial: RestockState = {}

interface Props {
  productId: string
}

export function RestockForm({ productId }: Props) {
  const [state, formAction, pending] = useActionState(subscribeRestockAction, initial)
  useActionToast(state)

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="productId" value={productId} />
      <div className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="妳的 email"
          className="flex-1 border border-line rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-ink"
        />
        <button
          type="submit"
          disabled={pending}
          className="font-jp bg-ink text-cream px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50 whitespace-nowrap tracking-wider"
        >
          {pending ? '・・・' : '入荷通知 · 到貨通知我'}
        </button>
      </div>
      <Turnstile />
      <p className="text-xs text-ink-soft">入荷後 Email 通知，不會收到行銷信。</p>
    </form>
  )
}
