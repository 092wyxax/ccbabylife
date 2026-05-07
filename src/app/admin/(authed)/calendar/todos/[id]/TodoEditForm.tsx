'use client'

import { useActionState, useState } from 'react'
import type { TodoFormState } from '@/server/actions/todos'

interface AdminOpt {
  id: string
  name: string
}

interface TodoEdit {
  id: string
  title: string
  body: string | null
  dueAt: string | null
  priority: 'low' | 'normal' | 'high'
  isShared: boolean
  assigneeId: string | null
}

interface Props {
  todo: TodoEdit
  admins: AdminOpt[]
  action: (
    prev: TodoFormState,
    formData: FormData
  ) => Promise<TodoFormState>
}

const inputCls = 'w-full border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-ink'

function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const tzOffset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16)
}

export function TodoEditForm({ todo, admins, action }: Props) {
  const [state, formAction, pending] = useActionState<TodoFormState, FormData>(
    action,
    {}
  )
  const [isShared, setIsShared] = useState(todo.isShared)

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded">
          {state.error}
        </div>
      )}

      <Field label="標題" required>
        <input
          name="title"
          required
          maxLength={200}
          defaultValue={todo.title}
          className={inputCls}
        />
      </Field>

      <Field label="內容說明">
        <textarea
          name="body"
          rows={4}
          maxLength={2000}
          defaultValue={todo.body ?? ''}
          placeholder="細節、檢查清單、提醒事項..."
          className={inputCls}
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="到期時間">
          <input
            name="dueAt"
            type="datetime-local"
            defaultValue={toLocalInput(todo.dueAt)}
            className={inputCls}
          />
        </Field>

        <Field label="優先度">
          <select
            name="priority"
            defaultValue={todo.priority}
            className={inputCls + ' bg-white'}
          >
            <option value="high">高</option>
            <option value="normal">一般</option>
            <option value="low">低</option>
          </select>
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isShared"
            checked={isShared}
            onChange={(e) => setIsShared(e.target.checked)}
            className="w-4 h-4"
          />
          共用代辦（全店都看得到）
        </label>
      </div>

      {!isShared && (
        <Field label="指派給">
          <select
            name="assigneeId"
            defaultValue={todo.assigneeId ?? ''}
            className={inputCls + ' bg-white'}
          >
            <option value="">指派給自己</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="flex gap-3 pt-2 border-t border-line">
        <button
          type="submit"
          disabled={pending}
          className="bg-ink text-cream px-5 py-2 rounded text-sm hover:bg-accent disabled:opacity-50"
        >
          {pending ? '儲存中⋯' : '儲存變更'}
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
