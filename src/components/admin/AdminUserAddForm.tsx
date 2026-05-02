'use client'

import { useActionState } from 'react'
import {
  createAdminUserAction,
  type AdminUserActionState,
} from '@/server/actions/admin-users'
import { adminRoleEnum } from '@/db/schema'

const initial: AdminUserActionState = {}

export function AdminUserAddForm() {
  const [state, formAction, pending] = useActionState(createAdminUserAction, initial)

  return (
    <form action={formAction} className="space-y-3 max-w-md">
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

      <Field label="Email" name="email" type="email" required />
      <Field label="姓名" name="name" required />
      <Field
        label="初始密碼"
        name="password"
        type="password"
        required
        hint="至少 8 字元，建議用密碼產生器"
      />
      <div>
        <label htmlFor="role" className="block text-xs text-ink-soft mb-1">
          角色 <span className="text-danger">*</span>
        </label>
        <select
          id="role"
          name="role"
          required
          defaultValue="admin"
          className="w-full border border-line rounded-md px-2 py-1 text-sm bg-white"
        >
          {adminRoleEnum.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-ink text-cream px-4 py-2 rounded-md text-sm hover:bg-accent disabled:opacity-50"
      >
        {pending ? '新增中⋯' : '新增管理員'}
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
}: {
  label: string
  name: string
  type?: string
  required?: boolean
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
        className="w-full border border-line rounded-md px-2 py-1 text-sm focus:outline-none focus:border-ink"
      />
      {hint && <p className="text-xs text-ink-soft mt-1">{hint}</p>}
    </div>
  )
}
