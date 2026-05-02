'use client'

import { useActionState } from 'react'
import {
  createCompetitorAction,
  type IntelligenceActionState,
} from '@/server/actions/intelligence'

const initial: IntelligenceActionState = {}

export function CompetitorAddForm() {
  const [state, formAction, pending] = useActionState(createCompetitorAction, initial)

  return (
    <form action={formAction} className="space-y-3">
      {state.error && (
        <p className="text-xs text-danger">{state.error}</p>
      )}
      {state.success && (
        <p className="text-xs text-success">{state.success}</p>
      )}

      <Field label="競品名稱" name="name" required />
      <Field label="IG 帳號" name="ig" placeholder="例：@xxx_japan" />
      <Field label="蝦皮賣場 URL" name="shopee" />
      <Field label="官網" name="website" />
      <Field
        label="追蹤關鍵字（逗號分隔）"
        name="monitoredKeywords"
        placeholder="例：Pigeon, Combi, 嬰兒紗布巾"
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
        className="text-xs bg-ink text-cream px-3 py-1.5 rounded-md hover:bg-accent disabled:opacity-50"
      >
        {pending ? '新增中⋯' : '新增競品'}
      </button>
    </form>
  )
}

function Field({
  label,
  name,
  required,
  placeholder,
}: {
  label: string
  name: string
  required?: boolean
  placeholder?: string
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
        required={required}
        placeholder={placeholder}
        className="w-full border border-line rounded-md px-2 py-1 text-sm focus:outline-none focus:border-ink"
      />
    </div>
  )
}
