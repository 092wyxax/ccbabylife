'use client'

import { useActionState } from 'react'
import {
  adjustOrderAmountAction,
  type AdjustAmountState,
} from '@/server/actions/orders'

interface Props {
  orderId: string
  shippingFee: number
  manualAdjustment: number
}

export function AmountAdjustForm({ orderId, shippingFee, manualAdjustment }: Props) {
  const [state, action, pending] = useActionState<AdjustAmountState, FormData>(
    adjustOrderAmountAction,
    {}
  )

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />

      {state.error && <p className="text-xs text-danger">{state.error}</p>}
      {state.success && <p className="text-xs text-success">{state.success}</p>}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="adj-ship" className="block text-xs text-ink-soft mb-1">
            運費（TWD）
          </label>
          <input
            id="adj-ship"
            name="shippingFee"
            type="number"
            min={0}
            max={100000}
            step={1}
            required
            defaultValue={shippingFee}
            className="w-full border border-line rounded px-2 py-1 text-sm tabular-nums focus:outline-none focus:border-ink"
          />
        </div>
        <div>
          <label htmlFor="adj-manual" className="block text-xs text-ink-soft mb-1">
            加收 / 折讓
          </label>
          <input
            id="adj-manual"
            name="manualAdjustment"
            type="number"
            min={-100000}
            max={100000}
            step={1}
            defaultValue={manualAdjustment}
            className="w-full border border-line rounded px-2 py-1 text-sm tabular-nums focus:outline-none focus:border-ink"
          />
        </div>
      </div>
      <p className="text-[11px] text-ink-soft leading-relaxed">
        加收填正數（如超重運費 +120）、折讓填負數（如熟客 −50）。
      </p>

      <div>
        <label htmlFor="adj-reason" className="block text-xs text-ink-soft mb-1">
          調整原因（必填，記入稽核）
        </label>
        <input
          id="adj-reason"
          name="reason"
          required
          maxLength={200}
          placeholder="例：超重補收海運費"
          className="w-full border border-line rounded px-2 py-1 text-sm focus:outline-none focus:border-ink"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ink text-cream py-1.5 rounded text-sm hover:bg-accent disabled:opacity-50"
      >
        {pending ? '更新中⋯' : '更新金額'}
      </button>
    </form>
  )
}
