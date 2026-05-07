'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import {
  createTodoAction,
  toggleTodoDoneAction,
  deleteTodoAction,
  type TodoFormState,
} from '@/server/actions/todos'

interface TodoView {
  id: string
  title: string
  dueAt: string | null
  priority: 'low' | 'normal' | 'high'
  status: 'open' | 'done' | 'cancelled'
  isShared: boolean
  createdById: string
  assigneeId: string | null
}

interface Props {
  todos: TodoView[]
  currentAdminId: string
}

const PRIORITY_LABEL = { low: '低', normal: '一般', high: '高' } as const
const PRIORITY_BADGE = {
  high: 'bg-red-100 text-red-700',
  normal: 'bg-ink/10 text-ink',
  low: 'bg-slate-100 text-slate-600',
} as const

const PRIORITY_ORDER = { high: 0, normal: 1, low: 2 } as const

export function TodoSection({ todos, currentAdminId }: Props) {
  const [createState, createAction, createPending] = useActionState<
    TodoFormState,
    FormData
  >(createTodoAction, {})

  const open = todos
    .filter((t) => t.status === 'open')
    .sort((a, b) => {
      const pri = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      if (pri !== 0) return pri
      const ad = a.dueAt ? new Date(a.dueAt).getTime() : Infinity
      const bd = b.dueAt ? new Date(b.dueAt).getTime() : Infinity
      return ad - bd
    })

  const done = todos
    .filter((t) => t.status === 'done')
    .sort((a, b) => {
      const ad = a.dueAt ? new Date(a.dueAt).getTime() : 0
      const bd = b.dueAt ? new Date(b.dueAt).getTime() : 0
      return bd - ad
    })

  return (
    <section className="space-y-4">
      <header>
        <h2 className="font-serif text-lg">待辦事項</h2>
        <p className="text-xs text-ink-soft">
          共用代辦全店都看得到；個人代辦僅你跟店主/經理看得到。
        </p>
      </header>

      {/* Create row */}
      <form
        action={createAction}
        className="grid grid-cols-1 sm:grid-cols-[1fr_180px_120px_110px_80px] gap-2 bg-cream-50/60 border border-line rounded-md p-3"
      >
        {createState.error && (
          <div className="sm:col-span-5 bg-danger/10 border border-danger/40 text-danger text-xs p-2 rounded">
            {createState.error}
          </div>
        )}
        <input
          name="title"
          required
          maxLength={200}
          placeholder="代辦標題..."
          className="border border-line rounded px-2 py-1.5 text-sm focus:outline-none focus:border-ink"
        />
        <input
          name="dueAt"
          type="datetime-local"
          className="border border-line rounded px-2 py-1.5 text-sm focus:outline-none focus:border-ink"
        />
        <select
          name="priority"
          defaultValue="normal"
          className="border border-line rounded px-2 py-1.5 text-sm bg-white"
        >
          <option value="high">高</option>
          <option value="normal">一般</option>
          <option value="low">低</option>
        </select>
        <label className="flex items-center gap-1.5 text-xs px-1">
          <input type="checkbox" name="isShared" className="w-3.5 h-3.5" />
          共用
        </label>
        <button
          type="submit"
          disabled={createPending}
          className="bg-ink text-cream rounded text-sm hover:bg-accent disabled:opacity-50"
        >
          {createPending ? '...' : '+ 新增'}
        </button>
      </form>

      {/* Open list */}
      {open.length === 0 ? (
        <p className="text-sm text-ink-soft text-center py-6">
          沒有未完成的代辦事項
        </p>
      ) : (
        <ul className="bg-white border border-line rounded-lg overflow-hidden divide-y divide-line">
          {open.map((t) => (
            <TodoRow key={t.id} todo={t} currentAdminId={currentAdminId} />
          ))}
        </ul>
      )}

      {/* Done collapsed */}
      {done.length > 0 && (
        <details className="text-sm">
          <summary className="text-xs text-ink-soft cursor-pointer hover:text-ink">
            已完成 ({done.length})
          </summary>
          <ul className="bg-white/50 border border-line rounded-lg overflow-hidden divide-y divide-line mt-2">
            {done.map((t) => (
              <TodoRow key={t.id} todo={t} currentAdminId={currentAdminId} />
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}

function TodoRow({
  todo,
  currentAdminId,
}: {
  todo: TodoView
  currentAdminId: string
}) {
  const isDone = todo.status === 'done'
  const canDelete = todo.createdById === currentAdminId

  return (
    <li className="flex items-center gap-3 px-3 py-2 hover:bg-cream-50/50">
      <form action={toggleTodoDoneAction} className="flex">
        <input type="hidden" name="id" value={todo.id} />
        <button
          type="submit"
          aria-label={isDone ? '取消完成' : '標記完成'}
          className={`w-5 h-5 rounded border flex items-center justify-center text-[11px] ${
            isDone
              ? 'bg-success/20 border-success/40 text-success'
              : 'border-line hover:border-ink'
          }`}
        >
          {isDone ? '✓' : ''}
        </button>
      </form>

      <Link
        href={`/admin/calendar/todos/${todo.id}`}
        className="flex-1 min-w-0 flex items-center gap-2"
      >
        <span
          className={`flex-1 truncate text-sm ${
            isDone ? 'line-through text-ink-soft' : ''
          }`}
        >
          {todo.title}
        </span>
        {todo.priority !== 'normal' && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_BADGE[todo.priority]}`}
          >
            {PRIORITY_LABEL[todo.priority]}
          </span>
        )}
        {todo.isShared && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
            共用
          </span>
        )}
        {todo.dueAt && (
          <span className="text-xs text-ink-soft whitespace-nowrap">
            {formatDue(todo.dueAt)}
          </span>
        )}
      </Link>

      {canDelete && (
        <form action={deleteTodoAction}>
          <input type="hidden" name="id" value={todo.id} />
          <button
            type="submit"
            className="text-xs text-ink-soft hover:text-danger"
            aria-label="刪除"
          >
            ×
          </button>
        </form>
      )}
    </li>
  )
}

function formatDue(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  if (sameDay) return '今日 ' + d.toTimeString().slice(0, 5)
  const fmt = d.toLocaleDateString('zh-Hant', {
    month: '2-digit',
    day: '2-digit',
  })
  return fmt
}
