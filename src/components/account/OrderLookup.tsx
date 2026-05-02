'use client'

import { useActionState } from 'react'
import { lookupOrderAction, type LookupState } from '@/server/actions/account'

const initial: LookupState = {}

export function OrderLookup() {
  const [state, formAction, pending] = useActionState(lookupOrderAction, initial)

  return (
    <form action={formAction} className="space-y-4 max-w-md bg-white border border-line rounded-lg p-6">
      <div>
        <label htmlFor="orderNumber" className="block text-sm mb-1.5">
          訂單編號 <span className="text-danger">*</span>
        </label>
        <input
          id="orderNumber"
          name="orderNumber"
          required
          placeholder="例：N20260502...."
          className="w-full border border-line rounded-md px-3 py-2 font-mono focus:outline-none focus:border-ink"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm mb-1.5">
          下單時填的 Email <span className="text-danger">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
        />
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ink text-cream py-2.5 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
      >
        {pending ? '查詢中⋯' : '查詢訂單'}
      </button>
    </form>
  )
}
