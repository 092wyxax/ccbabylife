'use client'

import { useActionState } from 'react'
import {
  setStockAction,
  type InventoryActionState,
} from '@/server/actions/inventory'

const initial: InventoryActionState = {}

interface Props {
  productId: string
  currentQuantity: number
}

export function StockAdjustForm({ productId, currentQuantity }: Props) {
  const [state, formAction, pending] = useActionState(setStockAction, initial)

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="productId" value={productId} />
      <input
        name="quantity"
        type="number"
        min={0}
        defaultValue={currentQuantity}
        className="w-16 border border-line rounded-md px-2 py-1 text-sm text-right"
      />
      <input
        name="reason"
        type="text"
        placeholder="原因"
        className="w-28 border border-line rounded-md px-2 py-1 text-xs text-ink-soft"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-xs bg-ink text-cream px-2 py-1 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
      >
        {pending ? '⋯' : '儲存'}
      </button>
      {state.error && <span className="text-xs text-danger ml-1">{state.error}</span>}
      {state.success && <span className="text-xs text-success ml-1">✓</span>}
    </form>
  )
}
