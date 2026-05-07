'use client'

import { useActionState } from 'react'
import {
  updateOrderNotesAction,
  type UpdateNotesState,
} from '@/server/actions/orders'

interface Props {
  orderId: string
  notes: string | null
}

export function OrderNotesForm({ orderId, notes }: Props) {
  const [state, action, pending] = useActionState<UpdateNotesState, FormData>(
    updateOrderNotesAction,
    {}
  )

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="orderId" value={orderId} />

      <textarea
        name="notes"
        rows={4}
        maxLength={2000}
        defaultValue={notes ?? ''}
        placeholder="內部備註（不對客戶顯示）：客服紀錄、特殊指示、廠商溝通…"
        className="w-full border border-line rounded px-2 py-1.5 text-sm focus:outline-none focus:border-ink"
      />

      <div className="flex items-center justify-between gap-2">
        {state.error && <p className="text-xs text-danger">{state.error}</p>}
        {state.success && <p className="text-xs text-success">{state.success}</p>}
        <button
          type="submit"
          disabled={pending}
          className="ml-auto text-xs bg-ink text-cream px-3 py-1 rounded hover:bg-accent disabled:opacity-50"
        >
          {pending ? '⋯' : '儲存備註'}
        </button>
      </div>
    </form>
  )
}
