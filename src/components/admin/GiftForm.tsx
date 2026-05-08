'use client'

import { useActionState } from 'react'
import type { ThresholdGift } from '@/db/schema/promotions'
import type { PromoState } from '@/server/actions/promotions'

const initial: PromoState = {}

interface Props {
  gift?: ThresholdGift
  action: (prev: PromoState, formData: FormData) => Promise<PromoState>
  submitLabel: string
  products: Array<{ id: string; name: string }>
}

function toLocalDateTime(d: Date | null | string | undefined): string {
  if (!d) return ''
  const dt = typeof d === 'string' ? new Date(d) : d
  if (isNaN(dt.getTime())) return ''
  const offset = dt.getTimezoneOffset() * 60_000
  return new Date(dt.getTime() - offset).toISOString().slice(0, 16)
}

export function GiftForm({ gift, action, submitLabel, products }: Props) {
  const [state, formAction, pending] = useActionState(action, initial)

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
          {state.error}
        </div>
      )}

      <Field
        label="活動名稱"
        name="name"
        required
        defaultValue={gift?.name ?? ''}
        placeholder="例：滿 1500 送濕紙巾"
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="最低消費金額 (NTD)"
          name="thresholdTwd"
          type="number"
          required
          defaultValue={String(gift?.thresholdTwd ?? 1500)}
        />
        <Field
          label="贈品數量"
          name="quantity"
          type="number"
          defaultValue={String(gift?.quantity ?? 1)}
        />
      </div>

      <div>
        <label htmlFor="giftProductId" className="block text-sm mb-1.5">
          贈品商品 <span className="text-danger">*</span>
        </label>
        <select
          id="giftProductId"
          name="giftProductId"
          required
          defaultValue={gift?.giftProductId ?? ''}
          className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
        >
          <option value="">請選擇⋯</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="開始時間（選填）"
          name="startsAt"
          type="datetime-local"
          defaultValue={toLocalDateTime(gift?.startsAt ?? null)}
        />
        <Field
          label="結束時間（選填）"
          name="expiresAt"
          type="datetime-local"
          defaultValue={toLocalDateTime(gift?.expiresAt ?? null)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={gift?.isActive ?? true}
          className="w-4 h-4"
        />
        啟用此活動
      </label>

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
  defaultValue,
  placeholder,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
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
    </div>
  )
}
