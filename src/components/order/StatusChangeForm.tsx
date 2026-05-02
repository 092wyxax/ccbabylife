'use client'

import { useActionState } from 'react'
import type { OrderStatus } from '@/db/schema'
import { STATUS_LABEL } from '@/lib/order-progress'
import {
  changeOrderStatusAction,
  type ChangeStatusState,
} from '@/server/actions/orders'

interface Props {
  orderId: string
  currentStatus: OrderStatus
  validNext: OrderStatus[]
}

const initial: ChangeStatusState = {}

export function StatusChangeForm({ orderId, currentStatus, validNext }: Props) {
  const [state, formAction, pending] = useActionState(
    async (prev: ChangeStatusState, fd: FormData) =>
      changeOrderStatusAction(orderId, prev, fd),
    initial
  )

  if (validNext.length === 0) {
    return (
      <p className="text-sm text-ink-soft">
        此狀態為終局狀態（{STATUS_LABEL[currentStatus]}），不可再變更。
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
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="reason" className="block text-sm mb-1.5">
          原因 / 備註
        </label>
        <input
          id="reason"
          name="reason"
          type="text"
          placeholder="可選，會記錄到 audit log"
          className="w-full border border-line rounded-md px-3 py-2"
        />
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ink text-cream py-2.5 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
      >
        {pending ? '處理中⋯' : '送出狀態變更'}
      </button>
    </form>
  )
}
