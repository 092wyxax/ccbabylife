'use client'

import { useActionState } from 'react'
import {
  changePasswordAction,
  type ChangePasswordState,
} from '@/server/actions/change-password'

const initial: ChangePasswordState = {}

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initial)

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm mb-1.5 text-ink-soft">
          新密碼
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          autoFocus
          className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
        />
        <p className="text-xs text-ink-soft mt-1">至少 8 字元</p>
      </div>

      <div>
        <label htmlFor="confirm" className="block text-sm mb-1.5 text-ink-soft">
          再次輸入新密碼
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ink text-cream py-2.5 rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50"
      >
        {pending ? '儲存中⋯' : '儲存新密碼'}
      </button>
    </form>
  )
}
