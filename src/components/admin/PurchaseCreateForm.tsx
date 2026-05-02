'use client'

import { useActionState } from 'react'
import {
  createPurchaseAction,
  type ActionState,
} from '@/server/actions/purchases'
import type { Supplier } from '@/db/schema/purchases'

const initial: ActionState = {}

interface Props {
  suppliers: Supplier[]
}

export function PurchaseCreateForm({ suppliers }: Props) {
  const [state, formAction, pending] = useActionState(createPurchaseAction, initial)
  const errs = state.fieldErrors ?? {}

  // Suggest a default batch label like "2026-W19"
  const today = new Date()
  const year = today.getFullYear()
  const start = new Date(year, 0, 1)
  const days = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const week = Math.ceil((days + start.getDay() + 1) / 7)
  const defaultLabel = `${year}-W${String(week).padStart(2, '0')}`

  return (
    <form action={formAction} className="space-y-5 max-w-xl">
      {state.error && (
        <div className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="batchLabel" className="block text-sm mb-1.5">
          批次標籤 <span className="text-danger">*</span>
        </label>
        <input
          id="batchLabel"
          name="batchLabel"
          required
          defaultValue={defaultLabel}
          placeholder="例：2026-W19 或 2026-05-12"
          className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
        />
        <p className="text-xs text-ink-soft mt-1">
          通常一週一張採購單。建議用 ISO 週數（YYYY-Www）或日本下單日期。
        </p>
        {errs.batchLabel && <p className="text-xs text-danger mt-1">{errs.batchLabel}</p>}
      </div>

      <div>
        <label htmlFor="supplierId" className="block text-sm mb-1.5">
          供應商
        </label>
        <select
          id="supplierId"
          name="supplierId"
          className="w-full border border-line rounded-md px-3 py-2 bg-white"
        >
          <option value="">— 之後再指定 / 混合 —</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm mb-1.5">
          備註
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="例：本批以 Pigeon 為主，缺貨補足"
          className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-ink text-cream px-6 py-2.5 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
      >
        {pending ? '建立中⋯' : '建立採購單'}
      </button>
    </form>
  )
}
