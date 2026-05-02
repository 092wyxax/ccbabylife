'use client'

import { useActionState } from 'react'
import {
  updateCustomerProfileAction,
  setBlacklistAction,
  adjustStoreCreditAction,
  setTagsAction,
  type CustomerActionState,
} from '@/server/actions/customers'
import type { Customer } from '@/db/schema'

const initial: CustomerActionState = {}

export function ProfileEditPanel({ customer }: { customer: Customer }) {
  const [state, formAction, pending] = useActionState(
    async (prev: CustomerActionState, fd: FormData) =>
      updateCustomerProfileAction(customer.id, prev, fd),
    initial
  )

  return (
    <form action={formAction} className="space-y-3">
      <Field label="姓名" name="name" defaultValue={customer.name ?? ''} />
      <Field label="電話" name="phone" defaultValue={customer.phone ?? ''} />
      <Field
        label="寶寶出生日期"
        name="babyBirthDate"
        type="date"
        defaultValue={customer.babyBirthDate ?? ''}
      />
      <div>
        <label htmlFor="babyGender" className="block text-xs text-ink-soft mb-1">
          寶寶性別
        </label>
        <select
          id="babyGender"
          name="babyGender"
          defaultValue={customer.babyGender ?? ''}
          className="w-full border border-line rounded-md px-2 py-1 text-sm bg-white"
        >
          <option value="">未提供</option>
          <option value="男">男</option>
          <option value="女">女</option>
          <option value="不公開">不公開</option>
        </select>
      </div>
      <ActionResult state={state} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs bg-ink text-cream px-3 py-1.5 rounded-md hover:bg-accent disabled:opacity-50"
      >
        {pending ? '儲存中⋯' : '儲存基本資料'}
      </button>
    </form>
  )
}

export function BlacklistTogglePanel({ customer }: { customer: Customer }) {
  const next = !customer.isBlacklisted
  const [state, formAction, pending] = useActionState(
    async (prev: CustomerActionState, fd: FormData) =>
      setBlacklistAction(customer.id, prev, fd),
    initial
  )

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="isBlacklisted" value={String(next)} />
      <p className="text-xs text-ink-soft">
        目前狀態：
        <strong className={customer.isBlacklisted ? 'text-danger' : 'text-success'}>
          {customer.isBlacklisted ? '黑名單' : '正常'}
        </strong>
      </p>
      <ActionResult state={state} />
      <button
        type="submit"
        disabled={pending}
        className={
          'text-xs px-3 py-1.5 rounded-md transition-colors ' +
          (next
            ? 'bg-danger/15 text-danger hover:bg-danger hover:text-white'
            : 'bg-success/15 text-ink hover:bg-success hover:text-white') +
          ' disabled:opacity-50'
        }
      >
        {pending ? '處理中⋯' : next ? '加入黑名單' : '取消黑名單'}
      </button>
    </form>
  )
}

export function StoreCreditPanel({ customer }: { customer: Customer }) {
  const [state, formAction, pending] = useActionState(
    async (prev: CustomerActionState, fd: FormData) =>
      adjustStoreCreditAction(customer.id, prev, fd),
    initial
  )

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="currentCredit" value={customer.storeCredit} />
      <p className="text-xs text-ink-soft">
        目前餘額：<strong>NT${customer.storeCredit.toLocaleString()}</strong>
      </p>
      <Field
        label="調整量（正為加、負為扣）"
        name="delta"
        type="number"
        placeholder="例：100 或 -50"
      />
      <Field label="原因（選填）" name="reason" placeholder="例：客訴補償" />
      <ActionResult state={state} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs bg-ink text-cream px-3 py-1.5 rounded-md hover:bg-accent disabled:opacity-50"
      >
        {pending ? '處理中⋯' : '送出調整'}
      </button>
    </form>
  )
}

export function TagsPanel({ customer }: { customer: Customer }) {
  const [state, formAction, pending] = useActionState(
    async (prev: CustomerActionState, fd: FormData) =>
      setTagsAction(customer.id, prev, fd),
    initial
  )
  const current = customer.tags?.join(', ') ?? ''

  return (
    <form action={formAction} className="space-y-3">
      <Field
        label="標籤（用逗號分隔）"
        name="tags"
        defaultValue={current}
        placeholder="例：VIP, 重複客, 寵物大戶"
      />
      <ActionResult state={state} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs bg-ink text-cream px-3 py-1.5 rounded-md hover:bg-accent disabled:opacity-50"
      >
        {pending ? '儲存中⋯' : '儲存標籤'}
      </button>
    </form>
  )
}

function Field({
  label,
  name,
  type = 'text',
  defaultValue,
  placeholder,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string
  placeholder?: string
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs text-ink-soft mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full border border-line rounded-md px-2 py-1 text-sm focus:outline-none focus:border-ink"
      />
    </div>
  )
}

function ActionResult({ state }: { state: CustomerActionState }) {
  if (state.error) return <p className="text-xs text-danger">{state.error}</p>
  if (state.success) return <p className="text-xs text-success">{state.success}</p>
  return null
}
