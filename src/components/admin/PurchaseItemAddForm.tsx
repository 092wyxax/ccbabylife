'use client'

import { useActionState } from 'react'
import {
  addPurchaseItemAction,
  type ActionState,
} from '@/server/actions/purchases'
import type { Product } from '@/db/schema'

const initial: ActionState = {}

interface Props {
  purchaseId: string
  products: Pick<Product, 'id' | 'nameZh' | 'priceJpy' | 'costJpy'>[]
}

export function PurchaseItemAddForm({ purchaseId, products }: Props) {
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, fd: FormData) =>
      addPurchaseItemAction(purchaseId, prev, fd),
    initial
  )
  const errs = state.fieldErrors ?? {}

  return (
    <form
      action={formAction}
      className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_140px_100px] gap-3 items-end"
    >
      <div>
        <label htmlFor="productNameSnapshot" className="block text-xs text-ink-soft mb-1">
          品名
        </label>
        <input
          id="productNameSnapshot"
          name="productNameSnapshot"
          required
          list="product-options"
          className="w-full border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-ink"
        />
        <datalist id="product-options">
          {products.map((p) => (
            <option key={p.id} value={p.nameZh} />
          ))}
        </datalist>
        {errs.productNameSnapshot && (
          <p className="text-xs text-danger mt-1">{errs.productNameSnapshot}</p>
        )}
      </div>

      <div>
        <label htmlFor="quantity" className="block text-xs text-ink-soft mb-1">
          數量
        </label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          required
          defaultValue={1}
          className="w-full border border-line rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="unitJpy" className="block text-xs text-ink-soft mb-1">
          單價（日幣）
        </label>
        <input
          id="unitJpy"
          name="unitJpy"
          type="number"
          min={0}
          required
          className="w-full border border-line rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-xs text-ink-soft mb-1">
          備註（選填）
        </label>
        <input
          id="notes"
          name="notes"
          className="w-full border border-line rounded-md px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-ink text-cream py-2 rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50"
      >
        {pending ? '加入中⋯' : '加入'}
      </button>

      {state.error && (
        <p className="sm:col-span-5 text-xs text-danger">{state.error}</p>
      )}
    </form>
  )
}
