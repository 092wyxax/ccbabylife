'use client'

import { useActionState } from 'react'
import {
  createSupplierAction,
  type ActionState,
} from '@/server/actions/purchases'
import { SUPPLIER_TYPE_LABEL } from '@/lib/purchase-status'
import { supplierTypeEnum } from '@/db/schema/purchases'

const initial: ActionState = {}

export function SupplierAddForm() {
  const [state, formAction, pending] = useActionState(createSupplierAction, initial)
  const errs = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="space-y-4 max-w-xl">
      {state.error && (
        <div className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="bg-success/15 border border-success/40 text-ink text-sm p-3 rounded-md">
          {state.success}
        </div>
      )}

      <div className="grid sm:grid-cols-[1fr_180px] gap-3">
        <div>
          <label htmlFor="name" className="block text-sm mb-1.5">
            名稱 <span className="text-danger">*</span>
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="例：樂天市場 / 直購 Pigeon 官網"
            className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
          />
          {errs.name && <p className="text-xs text-danger mt-1">{errs.name}</p>}
        </div>

        <div>
          <label htmlFor="type" className="block text-sm mb-1.5">
            類型 <span className="text-danger">*</span>
          </label>
          <select
            id="type"
            name="type"
            required
            defaultValue="rakuten"
            className="w-full border border-line rounded-md px-3 py-2 bg-white"
          >
            {supplierTypeEnum.map((t) => (
              <option key={t} value={t}>
                {SUPPLIER_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="contactInfo" className="block text-sm mb-1.5">
          聯絡資訊
        </label>
        <input
          id="contactInfo"
          name="contactInfo"
          placeholder="例：聯絡人 / Email / 帳戶"
          className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm mb-1.5">
          備註
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-ink text-cream px-5 py-2 rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50"
      >
        {pending ? '新增中⋯' : '新增供應商'}
      </button>
    </form>
  )
}
