'use client'

import { useActionState, useState } from 'react'
import {
  createAdminUserAction,
  type AdminUserActionState,
} from '@/server/actions/admin-users'
import type { AdminRole } from '@/db/schema/admin_users'

const initial: AdminUserActionState = {}

const ROLE_OPTIONS: Array<{ value: AdminRole; label: string; hint: string }> = [
  { value: 'manager', label: '經理', hint: '除人事與店設定外，其他皆可改' },
  { value: 'ops', label: '客服', hint: '處理訂單、客戶、評論、補貨通知' },
  { value: 'buyer', label: '採購', hint: '採購單、進貨來源、商品與庫存' },
  { value: 'editor', label: '編輯', hint: '部落格、電子報、行銷' },
]

const ROLE_LABEL: Record<string, string> = {
  manager: '經理',
  ops: '客服',
  buyer: '採購',
  editor: '編輯',
}

function buildTemplate(c: NonNullable<AdminUserActionState['credentials']>) {
  return [
    '🎌 熙熙初日後台帳號',
    '',
    `登入網址：${c.loginUrl}`,
    `Email：${c.email}`,
    `初始密碼：${c.password}`,
    `角色：${ROLE_LABEL[c.role] ?? c.role}`,
    '',
    '⚠ 第一次登入後請馬上換密碼（右上角頭像 → 設定）',
    '⚠ 不要把這段訊息留在公開群組或 Email',
  ].join('\n')
}

export function AdminUserAddForm() {
  const [state, formAction, pending] = useActionState(createAdminUserAction, initial)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!state.credentials) return
    await navigator.clipboard.writeText(buildTemplate(state.credentials))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4 max-w-md">
      <form action={formAction} className="space-y-3">
        {state.error && (
          <div className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
            {state.error}
          </div>
        )}
        {state.success && !state.credentials && (
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
            defaultValue="ops"
            className="w-full border border-line rounded-md px-2 py-1 text-sm bg-white"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label} — {r.hint}
              </option>
            ))}
          </select>
          <p className="text-xs text-ink-soft mt-1">
            僅有店主能存在 1 位，所以下拉沒有「店主」選項。
          </p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="bg-ink text-cream px-4 py-2 rounded-md text-sm hover:bg-accent disabled:opacity-50"
        >
          {pending ? '新增中⋯' : '新增管理員'}
        </button>
      </form>

      {state.credentials && (
        <div className="border border-success/40 bg-success/5 rounded-md p-4 space-y-3">
          <p className="text-sm font-medium text-ink">
            ✅ {state.success}
          </p>
          <p className="text-xs text-ink-soft">
            複製下方訊息私訊給對方（建議 LINE，不要走公開頻道）：
          </p>
          <pre className="bg-white border border-line rounded p-3 text-xs whitespace-pre-wrap break-all leading-relaxed select-all">
{buildTemplate(state.credentials)}
          </pre>
          <button
            type="button"
            onClick={handleCopy}
            className="w-full bg-ink text-cream py-2 rounded-md text-sm hover:bg-accent transition-colors"
          >
            {copied ? '✓ 已複製' : '一鍵複製'}
          </button>
          <p className="text-xs text-danger">
            ⚠ 此頁重新整理後密碼就看不到了，請現在就傳給對方。
          </p>
        </div>
      )}
    </div>
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
