'use client'

import { useActionState } from 'react'
import type { MemberTier } from '@/db/schema/member_tiers'
import type { TierState } from '@/server/actions/member-tiers'

const initial: TierState = {}

interface Props {
  tier?: MemberTier
  action: (prev: TierState, formData: FormData) => Promise<TierState>
  submitLabel: string
}

export function TierForm({ tier, action, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initial)

  return (
    <form action={formAction} className="space-y-5 max-w-xl">
      {state.error && (
        <div className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
          {state.error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="等級名稱" name="name" required defaultValue={tier?.name ?? ''} placeholder="例：銀卡" />
        <Field label="日文名（選填）" name="nameJp" defaultValue={tier?.nameJp ?? ''} placeholder="例：シルバー" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="累積消費門檻 (NTD)"
          name="thresholdTwd"
          type="number"
          required
          defaultValue={String(tier?.thresholdTwd ?? 0)}
          hint="達此累積消費自動升級"
        />
        <Field
          label="顯示顏色（選填）"
          name="color"
          type="color"
          defaultValue={tier?.color ?? '#cccccc'}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="折扣（basis points）"
          name="discountBp"
          type="number"
          defaultValue={String(tier?.discountBp ?? 0)}
          hint="500 = 5%、1000 = 10%"
        />
        <Field
          label="免運門檻 (NTD，留空 = 不享免運)"
          name="freeShipMinTwd"
          type="number"
          defaultValue={tier?.freeShipMinTwd != null ? String(tier.freeShipMinTwd) : ''}
        />
      </div>

      <Field
        label="生日購物金 (NTD)"
        name="birthdayBonusTwd"
        type="number"
        defaultValue={String(tier?.birthdayBonusTwd ?? 0)}
        hint="客戶寶寶生日當天自動發購物金"
      />

      <div>
        <label htmlFor="perks" className="block text-sm mb-1.5">
          特權說明（顯示給客戶看）
        </label>
        <textarea
          id="perks"
          name="perks"
          rows={4}
          defaultValue={tier?.perks ?? ''}
          placeholder="例：&#10;• 全店 9 折&#10;• 滿 NT$1,000 免運&#10;• 生日當月送 NT$200 購物金"
          className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
        />
      </div>

      <Field
        label="排序權重（同 threshold 時用）"
        name="sortOrder"
        type="number"
        defaultValue={String(tier?.sortOrder ?? 0)}
      />

      <button
        type="submit"
        disabled={pending}
        className="font-jp bg-ink text-cream px-6 py-2.5 rounded-md hover:bg-accent transition-colors disabled:opacity-50 tracking-wider"
      >
        {pending ? '儲存中⋯' : submitLabel}
      </button>
    </form>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required,
  hint,
  defaultValue,
  placeholder,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  hint?: string
  defaultValue?: string
  placeholder?: string
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm mb-1.5">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
      />
      {hint && <p className="text-xs text-ink-soft mt-1">{hint}</p>}
    </div>
  )
}
