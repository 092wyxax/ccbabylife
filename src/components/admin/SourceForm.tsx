'use client'

import { useActionState, useState } from 'react'
import {
  type SourceFormState,
} from '@/server/actions/sources'
import type { Source } from '@/db/schema/sources'

const TYPE_OPTIONS: Array<{ value: Source['type']; label: string }> = [
  { value: 'platform', label: '平台' },
  { value: 'brand', label: '品牌官網' },
  { value: 'chain', label: '連鎖店' },
  { value: 'resale', label: '二手平台' },
  { value: 'other', label: '其他' },
]

const STATUS_OPTIONS: Array<{ value: Source['status']; label: string }> = [
  { value: 'active', label: '常用' },
  { value: 'paused', label: '暫停' },
  { value: 'dropped', label: '不再使用' },
]

const CATEGORY_TAGS = [
  '哺乳用品',
  '副食品工具',
  '紙尿布',
  '嬰兒服飾',
  '寢具',
  '清潔用品',
  '玩具',
  '寵物食品',
  '寵物用品',
  '其他',
]

const PAYMENT_TAGS = [
  '信用卡',
  '銀行匯款',
  '超商付款',
  '代購服務',
  'PayPay',
  'PayPal',
  '其他',
]

interface Props {
  source?: Source
  action: (
    prev: SourceFormState,
    formData: FormData
  ) => Promise<SourceFormState>
  submitLabel: string
}

export function SourceForm({ source, action, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<SourceFormState, FormData>(
    action,
    {}
  )

  const [rating, setRating] = useState<number | null>(source?.rating ?? null)
  const [categories, setCategories] = useState<string[]>(source?.categories ?? [])
  const [payments, setPayments] = useState<string[]>(source?.paymentMethods ?? [])

  const toggleIn = (
    arr: string[],
    setter: (v: string[]) => void,
    val: string
  ) => {
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val])
  }

  return (
    <form action={formAction} className="space-y-8 max-w-3xl">
      {state.error && (
        <div className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
          {state.error}
        </div>
      )}

      {/* Tier 1 — Core */}
      <fieldset className="space-y-4">
        <legend className="text-xs uppercase tracking-widest text-ink-soft mb-2">
          基本資訊
        </legend>

        <Field label="網站名稱" required>
          <input
            name="name"
            required
            maxLength={100}
            defaultValue={source?.name ?? ''}
            placeholder="例：樂天日本、Pigeon 官網"
            className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
          />
        </Field>

        <Field label="網址" required>
          <input
            name="url"
            type="url"
            required
            defaultValue={source?.url ?? ''}
            placeholder="https://..."
            className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="類型" required>
            <select
              name="type"
              defaultValue={source?.type ?? 'platform'}
              className="w-full border border-line rounded-md px-3 py-2 bg-white focus:outline-none focus:border-ink"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="狀態" required>
            <select
              name="status"
              defaultValue={source?.status ?? 'active'}
              className="w-full border border-line rounded-md px-3 py-2 bg-white focus:outline-none focus:border-ink"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="強項描述">
          <textarea
            name="strengths"
            rows={2}
            maxLength={500}
            defaultValue={source?.strengths ?? ''}
            placeholder="例：紙尿布最便宜、紅利點數可累積、客服日文回應快"
            className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
          />
        </Field>
      </fieldset>

      {/* Tier 2 — Practical */}
      <fieldset className="space-y-4">
        <legend className="text-xs uppercase tracking-widest text-ink-soft mb-2">
          採購偏好
        </legend>

        <Field label="個人評分">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(rating === n ? null : n)}
                className="text-2xl transition-transform hover:scale-110"
                aria-label={`${n} 星`}
              >
                {rating !== null && n <= rating ? '★' : '☆'}
              </button>
            ))}
            {rating !== null && (
              <button
                type="button"
                onClick={() => setRating(null)}
                className="text-xs text-ink-soft hover:text-danger ml-2"
              >
                清除
              </button>
            )}
            <input type="hidden" name="rating" value={rating ?? ''} />
          </div>
        </Field>

        <Field label="商品分類標籤">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_TAGS.map((tag) => {
              const on = categories.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleIn(categories, setCategories, tag)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    on
                      ? 'bg-ink text-cream border-ink'
                      : 'bg-white text-ink-soft border-line hover:border-ink'
                  }`}
                >
                  {tag}
                </button>
              )
            })}
            {categories.map((c) => (
              <input key={c} type="hidden" name="categories" value={c} />
            ))}
          </div>
        </Field>

        <Field label="付款方式">
          <div className="flex flex-wrap gap-2">
            {PAYMENT_TAGS.map((tag) => {
              const on = payments.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleIn(payments, setPayments, tag)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    on
                      ? 'bg-ink text-cream border-ink'
                      : 'bg-white text-ink-soft border-line hover:border-ink'
                  }`}
                >
                  {tag}
                </button>
              )
            })}
            {payments.map((c) => (
              <input key={c} type="hidden" name="paymentMethods" value={c} />
            ))}
          </div>
        </Field>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="needsMembership"
              defaultChecked={source?.needsMembership ?? false}
              className="w-4 h-4"
            />
            需要日本會員 / 信用卡
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="shipsOverseas"
              defaultChecked={source?.shipsOverseas ?? false}
              className="w-4 h-4"
            />
            支援海外直送
          </label>
        </div>

        <Field label="備註 / 心得">
          <textarea
            name="notes"
            rows={4}
            maxLength={2000}
            defaultValue={source?.notes ?? ''}
            placeholder="坑、客服經驗、結帳訣竅、特殊優惠⋯"
            className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
          />
        </Field>
      </fieldset>

      {/* Tier 3 — Tracking */}
      <fieldset className="space-y-4">
        <legend className="text-xs uppercase tracking-widest text-ink-soft mb-2">
          追蹤統計
        </legend>

        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="上次叫貨日期">
            <input
              type="date"
              name="lastOrderedAt"
              defaultValue={
                source?.lastOrderedAt
                  ? new Date(source.lastOrderedAt).toISOString().slice(0, 10)
                  : ''
              }
              className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
            />
          </Field>

          <Field label="平均處理（天）">
            <input
              type="number"
              name="avgProcessingDays"
              min={0}
              max={365}
              defaultValue={source?.avgProcessingDays ?? ''}
              placeholder="例：3"
              className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
            />
          </Field>

          <Field label="平均單筆 JPY">
            <input
              type="number"
              name="avgOrderJpy"
              min={0}
              defaultValue={source?.avgOrderJpy ?? ''}
              placeholder="例：12000"
              className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
            />
          </Field>
        </div>
      </fieldset>

      <div className="flex gap-3 pt-2 border-t border-line">
        <button
          type="submit"
          disabled={pending}
          className="bg-ink text-cream px-5 py-2.5 rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50"
        >
          {pending ? '儲存中⋯' : submitLabel}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-sm mb-1.5 text-ink-soft">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
    </label>
  )
}
