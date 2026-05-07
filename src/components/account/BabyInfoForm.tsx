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
    <form action={formAction} className="space-y-3">
      <div>
        <label htmlFor="babyBirthDate" className="block text-sm mb-1.5">
          寶寶生日
        </label>
        <input
          id="babyBirthDate"
          name="babyBirthDate"
          type="date"
          defaultValue={initialBabyBirthDate ?? ''}
          className="w-full sm:w-auto border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
        />
        <p className="text-xs text-ink-soft mt-1">
          填了之後我們會在寶寶生日當天送你優惠券 🎁。隨時可以修改或清空。
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="font-jp text-sm bg-ink text-cream px-4 py-2 rounded-md hover:bg-accent transition-colors disabled:opacity-50 tracking-wider"
      >
        {pending ? '保存中⋯' : '保存 · 儲存'}
      </button>

      {state.error && (
        <p className="text-xs text-danger">{state.error}</p>
      )}
      {state.success && (
        <p className="text-xs text-accent">{state.success}</p>
      )}
    </form>
  )
}
