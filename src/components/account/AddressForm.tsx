'use client'

import { useActionState } from 'react'
import { useActionToast } from '@/hooks/useActionToast'
import {
  createAddressAction,
  updateAddressAction,
  type AddressActionState,
} from '@/server/actions/addresses'
import type { CustomerAddress } from '@/db/schema'

const initial: AddressActionState = {}

interface Props {
  mode: 'create' | 'edit'
  address?: CustomerAddress
}

export function AddressForm({ mode, address }: Props) {
  const action =
    mode === 'create'
      ? createAddressAction
      : async (prev: AddressActionState, fd: FormData) =>
          updateAddressAction(address!.id, prev, fd)
  const [state, formAction, pending] = useActionState(action, initial)
  useActionToast(state)

  return (
    <form action={formAction} className="space-y-4">
      <Field label="地址標籤" name="label" required defaultValue={address?.label ?? ''} placeholder="例：家、辦公室、長輩家" />
      <Row>
        <Field label="收件人" name="recipientName" required defaultValue={address?.recipientName ?? ''} />
        <Field label="電話" name="phone" type="tel" required defaultValue={address?.phone ?? ''} />
      </Row>
      <Row>
        <Field label="縣市" name="city" required defaultValue={address?.city ?? ''} placeholder="例：台北市" />
        <Field label="郵遞區號" name="zipcode" required defaultValue={address?.zipcode ?? ''} placeholder="例：106" />
      </Row>
      <Field label="詳細地址" name="street" required defaultValue={address?.street ?? ''} placeholder="例：信義路四段 1 號 5 樓" />
      <Field label="備註（選填）" name="notes" defaultValue={address?.notes ?? ''} placeholder="例：警衛室代收" />

      <label className="flex items-center gap-2 cursor-pointer text-sm">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={address?.isDefault ?? false}
        />
        <span>設為預設地址（結帳時自動帶出）</span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="bg-ink text-cream px-6 py-2.5 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
      >
        {pending ? '儲存中⋯' : mode === 'create' ? '新增地址' : '儲存變更'}
      </button>
    </form>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>
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
