'use client'

import { useActionState } from 'react'
import {
  changePurchaseStatusAction,
  type ActionState,
} from '@/server/actions/purchases'
import { PURCHASE_STATUS_LABEL } from '@/lib/purchase-status'
import type { PurchaseStatus } from '@/db/schema/purchases'

const initial: ActionState = {}

interface Props {
  purchaseId: string
  current: PurchaseStatus
  validNext: PurchaseStatus[]
}

export function PurchaseStatusForm({ purchaseId, current, validNext }: Props) {
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, fd: FormData) =>
      changePurchaseStatusAction(purchaseId, prev, fd),
    initial
  )

  if (validNext.length === 0) {
    return (
      <p className="text-sm text-ink-soft">
        此狀態為終局狀態（{PURCHASE_STATUS_LABEL[current]}）。
      </p>
    )
  }

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label htmlFor="toStatus" className="block text-sm mb-1.5">
          變更為
        </label>
        <select
          id="toStatus"
          name="toStatus"
          defaultValue={validNext[0]}
          className="w-full border border-line rounded-md px-3 py-2 bg-white"
        >
          {validNext.map((s) => (
            <option key={s} value={s}>
              {PURCHASE_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ink text-cream py-2 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
      >
        {pending ? '處理中⋯' : '送出'}
      </button>
    </form>
  )
}
