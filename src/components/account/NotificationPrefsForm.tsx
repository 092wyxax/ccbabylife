'use client'

import { useActionState } from 'react'
import {
  updateNotificationPrefsAction,
  type PrefsState,
} from '@/server/actions/account'

const initial: PrefsState = {}

interface Props {
  initialLine: boolean
  initialEmail: boolean
}

export function NotificationPrefsForm({ initialLine, initialEmail }: Props) {
  const [state, formAction, pending] = useActionState(
    updateNotificationPrefsAction,
    initial
  )

  return (
    <form action={formAction} className="space-y-5">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="line"
          defaultChecked={initialLine}
          className="mt-1"
        />
        <span className="text-sm">
          <span className="font-medium">LINE 訊息推播</span>
          <span className="block text-ink-soft text-xs mt-0.5">
            訂單狀態變更（已付款 → 日本下單 → 出貨 → 完成）會即時推到妳的 LINE。
            需先加我們的 LINE 官方帳號為好友。
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="email"
          defaultChecked={initialEmail}
          className="mt-1"
        />
        <span className="text-sm">
          <span className="font-medium">Email 通知</span>
          <span className="block text-ink-soft text-xs mt-0.5">
            重要訊息（訂單確認、付款連結、出貨通知）會寄到下單時填的 Email。
            建議保留以避免 LINE 失效時錯過通知。
          </span>
        </span>
      </label>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-ink text-cream px-5 py-2 rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50"
      >
        {pending ? '儲存中⋯' : '儲存偏好'}
      </button>
    </form>
  )
}
