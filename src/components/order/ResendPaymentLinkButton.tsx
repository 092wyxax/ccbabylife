'use client'

import { useActionState } from 'react'
import { useActionToast } from '@/hooks/useActionToast'
import {
  resendPaymentLinkFormAction,
  type ResendPaymentLinkState,
} from '@/server/actions/orders'

const initial: ResendPaymentLinkState = {}

interface Props {
  orderId: string
  hasLineUserId: boolean
}

export function ResendPaymentLinkButton({ orderId, hasLineUserId }: Props) {
  const [state, formAction, pending] = useActionState(
    resendPaymentLinkFormAction,
    initial
  )
  useActionToast(state)

  if (!hasLineUserId) {
    return (
      <p className="text-xs text-ink-soft">
        客戶尚未綁定 LINE，無法重發付款連結
      </p>
    )
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="orderId" value={orderId} />
      <button
        type="submit"
        disabled={pending}
        className="font-jp w-full bg-warning/15 hover:bg-warning text-ink hover:text-white px-3 py-2 text-sm rounded-md transition-colors disabled:opacity-50 tracking-wider"
      >
        {pending ? '送信中・・・' : '🔁 重發付款連結（LINE）'}
      </button>
    </form>
  )
}
