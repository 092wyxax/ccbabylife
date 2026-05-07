'use client'

import { useActionState } from 'react'
import {
  updateBabyInfoAction,
  type BabyInfoState,
} from '@/server/actions/account'

const initial: BabyInfoState = {}

interface Props {
  initialBabyBirthDate: string | null
}

export function BabyInfoForm({ initialBabyBirthDate }: Props) {
  const [state, formAction, pending] = useActionState(
    updateBabyInfoAction,
    initial
  )

  return (
    <form action={formAction} className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          id="babyBirthDate"
          name="babyBirthDate"
          type="date"
          required
          defaultValue={initialBabyBirthDate ?? ''}
          className="border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
        />
        <button
          type="submit"
          disabled={pending}
          className="font-jp text-sm bg-ink text-cream px-4 py-2 rounded-md hover:bg-accent transition-colors disabled:opacity-50 tracking-wider"
        >
          {pending ? '儲存中⋯' : '儲存'}
        </button>
      </div>
      <p className="text-xs text-warning leading-relaxed">
        ⚠️ 此設定僅能填寫一次，無法自行修改。我們會在寶寶生日當天自動送你優惠券 🎁
      </p>
      {state.error && (
        <p className="text-xs text-danger">{state.error}</p>
      )}
      {state.success && (
        <p className="text-xs text-accent">{state.success}</p>
      )}
    </form>
  )
}
