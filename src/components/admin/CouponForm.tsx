'use client'

import { useActionState, useState } from 'react'
import type { Coupon, CouponType, CouponAutoIssue } from '@/db/schema/coupons'
import type { CouponActionState } from '@/server/actions/coupons'

const TYPE_OPTIONS: Array<{ value: CouponType; label: string; hint: string }> = [
  { value: 'fixed', label: '固定金額折扣', hint: '直接折抵 NT$ X' },
  { value: 'percent', label: '百分比折扣', hint: '折扣 X %（1–100）' },
  { value: 'free_shipping', label: '免運', hint: '免運費（不影響商品價格）' },
  { value: 'tiered', label: '滿額折', hint: '滿 NT$ X 折抵 NT$ Y' },
]

const AUTO_ISSUE_OPTIONS: Array<{ value: CouponAutoIssue; label: string; hint: string }> = [
  { value: 'manual', label: '手動發放', hint: '不自動發，靠客戶輸入優惠碼' },
  { value: 'signup', label: '新會員', hint: '會員註冊時自動發給對方' },
  { value: 'birthday', label: '生日', hint: '客戶生日當週自動發放' },
  { value: 'restock_filled', label: '補貨完成', hint: '訂閱補貨通知的客戶在到貨時收到' },
  { value: 'referral_complete', label: '推薦成功', hint: '推薦的朋友首次下單成功時' },
]

const CATEGORIES = [
  '哺乳用品',
  '副食品工具',
  '紙尿布',
  '嬰兒服飾',
  '寢具',
  '清潔用品',
  '玩具',
  '寵物食品',
  '寵物用品',
]

interface Props {
  coupon?: Coupon
  action: (
    prev: CouponActionState,
    formData: FormData
  ) => Promise<CouponActionState>
  submitLabel: string
}

export function CouponForm({ coupon, action, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<CouponActionState, FormData>(
    action,
    {}
  )

  const [type, setType] = useState<CouponType>(coupon?.type ?? 'fixed')
  const [categories, setCategories] = useState<string[]>(
    coupon?.applicableCategorySlugs ?? []
  )

  const isFreeShipping = type === 'free_shipping'

  const toCalendar = (d: Date | null | undefined) =>
    d ? new Date(d).toISOString().slice(0, 16) : ''

  return (
    <form action={formAction} className="space-y-8 max-w-3xl">
      {state.error && (
        <div className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
          {state.error}
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="text-xs uppercase tracking-widest text-ink-soft mb-2">
          基本資訊
        </legend>

        <Field label="優惠碼" required>
          <input
            name="code"
            required
            maxLength={40}
            defaultValue={coupon?.code ?? ''}
            placeholder="例：WELCOME100"
            className="w-full font-mono uppercase border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
          />
          <p className="text-xs text-ink-soft mt-1">會自動轉成大寫</p>
        </Field>

        <Field label="優惠類型" required>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as CouponType)}
            className="w-full border border-line rounded-md px-3 py-2 bg-white focus:outline-none focus:border-ink"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} — {o.hint}
              </option>
            ))}
          </select>
        </Field>

        {!isFreeShipping && (
          <Field
            label={
              type === 'percent'
                ? '折扣 %'
                : type === 'tiered'
                ? '折抵金額（NT$）'
                : '折抵金額（NT$）'
            }
            required
          >
            <input
              type="number"
              name="value"
              required
              min={1}
              max={type === 'percent' ? 100 : 999999}
              defaultValue={coupon?.value ?? ''}
              className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
            />
          </Field>
        )}
        {isFreeShipping && (
          <input type="hidden" name="value" value="0" />
        )}

        <Field label="客戶看到的描述（選填）">
          <input
            name="description"
            maxLength={200}
            defaultValue={coupon?.description ?? ''}
            placeholder="例：新會員專屬，購物滿千折一百"
            className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
          />
        </Field>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-xs uppercase tracking-widest text-ink-soft mb-2">
          使用限制
        </legend>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label={
              type === 'tiered'
                ? '滿額門檻（NT$）'
                : '最低訂單金額（NT$）'
            }
            required={type === 'tiered'}
          >
            <input
              type="number"
              name="minOrderTwd"
              min={0}
              defaultValue={coupon?.minOrderTwd ?? 0}
              className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
            />
          </Field>

          <Field label="總使用次數上限">
            <input
              type="number"
              name="maxUses"
              min={1}
              defaultValue={coupon?.maxUses ?? ''}
              placeholder="留空 = 無上限"
              className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
            />
          </Field>

          <Field label="單人使用次數上限">
            <input
              type="number"
              name="perUserLimit"
              min={1}
              defaultValue={coupon?.perUserLimit ?? ''}
              placeholder="留空 = 無上限"
              className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="開始時間">
            <input
              type="datetime-local"
              name="startsAt"
              defaultValue={toCalendar(coupon?.startsAt)}
              className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
            />
          </Field>

          <Field label="結束時間">
            <input
              type="datetime-local"
              name="expiresAt"
              defaultValue={toCalendar(coupon?.expiresAt)}
              className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
            />
          </Field>
        </div>

        <Field label="可用商品分類（選填）">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const on = categories.includes(cat)
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setCategories(
                      on ? categories.filter((c) => c !== cat) : [...categories, cat]
                    )
                  }
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    on
                      ? 'bg-ink text-cream border-ink'
                      : 'bg-white text-ink-soft border-line hover:border-ink'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
            {categories.map((c) => (
              <input key={c} type="hidden" name="applicableCategorySlugs" value={c} />
            ))}
          </div>
          <p className="text-xs text-ink-soft mt-1">
            未選 = 全站商品都可用
          </p>
        </Field>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-xs uppercase tracking-widest text-ink-soft mb-2">
          自動發放
        </legend>

        <Field label="觸發條件">
          <select
            name="autoIssueOn"
            defaultValue={coupon?.autoIssueOn ?? 'manual'}
            className="w-full border border-line rounded-md px-3 py-2 bg-white focus:outline-none focus:border-ink"
          >
            {AUTO_ISSUE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} — {o.hint}
              </option>
            ))}
          </select>
          <p className="text-xs text-ink-soft mt-1">
            選了「手動發放」以外的選項，符合條件的客戶會自動領到此優惠碼。
          </p>
        </Field>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-xs uppercase tracking-widest text-ink-soft mb-2">
          其他
        </legend>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={coupon?.isActive ?? true}
            className="w-4 h-4"
          />
          啟用（取消勾選後，此優惠碼立即停用）
        </label>

        <Field label="內部備註（不對外顯示）">
          <textarea
            name="notes"
            rows={3}
            maxLength={1000}
            defaultValue={coupon?.notes ?? ''}
            placeholder="例：Q3 母嬰展促銷專用、僅內部稽核參考"
            className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
          />
        </Field>
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
