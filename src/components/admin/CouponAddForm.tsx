'use client'

import { useActionState } from 'react'
import {
  createCouponAction,
  type CouponActionState,
} from '@/server/actions/coupons'

const initial: CouponActionState = {}

export function CouponAddForm() {
  const [state, formAction, pending] = useActionState(createCouponAction, initial)

  return (
    <form action={formAction} className="space-y-3">
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

      <Field label="優惠碼" name="code" required placeholder="例：WELCOME100" />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="type" className="block text-xs text-ink-soft mb-1">
            類型
          </label>
          <select
            id="type"
            name="type"
            required
            defaultValue="fixed"
            className="w-full border border-line rounded-md px-2 py-1 text-sm bg-white"
          >
            <option value="fixed">固定金額（NT$）</option>
            <option value="percent">百分比（%）</option>
          </select>
        </div>
        <Field label="折扣值" name="value" type="number" required />
      </div>

      <Field
        label="低消金額（NT$）"
        name="minOrderTwd"
        type="number"
        hint="留 0 表示無限制"
      />
      <Field
        label="使用次數上限"
        name="maxUses"
        type="number"
        hint="留空表示無限"
      />
      <Field
        label="到期日"
        name="expiresAt"
        type="datetime-local"
        hint="留空表示永久"
      />
      <div>
        <label htmlFor="notes" className="block text-xs text-ink-soft mb-1">
          備註
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="w-full border border-line rounded-md px-2 py-1 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-ink text-cream px-4 py-2 rounded-md text-sm hover:bg-accent disabled:opacity-50"
      >
        {pending ? '新增中⋯' : '新增優惠碼'}
      </button>
    </form>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required,
  placeholder,
  hint,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  placeholder?: string
  hint?: string
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs text-ink-soft mb-1">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full border border-line rounded-md px-2 py-1 text-sm focus:outline-none focus:border-ink"
      />
      {hint && <p className="text-xs text-ink-soft mt-1">{hint}</p>}
    </div>
  )
}
