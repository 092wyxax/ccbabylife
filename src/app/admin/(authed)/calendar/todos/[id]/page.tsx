import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { todos } from '@/db/schema/todos'
import { adminUsers } from '@/db/schema/admin_users'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireRole } from '@/server/services/AdminAuthService'
import { updateTodoAction, deleteTodoAction } from '@/server/actions/todos'
import { TodoEditForm } from './TodoEditForm'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditTodoPage({ params }: Props) {
  const me = await requireRole(['owner', 'manager', 'ops', 'buyer', 'editor'])
  const { id } = await params

  const [todo] = await db
    .select()
    .from(todos)
    .where(and(eq(todos.orgId, DEFAULT_ORG_ID), eq(todos.id, id)))
    .limit(1)

  if (!todo) notFound()

  const isManager = me.role === 'owner' || me.role === 'manager'
  const canEdit =
    todo.createdById === me.id || todo.assigneeId === me.id || isManager
  if (!canEdit) notFound()

  const admins = await db
    .select({ id: adminUsers.id, name: adminUsers.name })
    .from(adminUsers)
    .where(
      and(
        eq(adminUsers.orgId, DEFAULT_ORG_ID),
        eq(adminUsers.status, 'active')
      )
    )
    .orderBy(asc(adminUsers.name))

  const boundUpdate = updateTodoAction.bind(null, id)
  const canDelete = todo.createdById === me.id || isManager

  return (
    <div className="p-6 sm:p-8 max-w-2xl">
      <Link
        href="/admin/calendar"
        className="text-xs text-ink-soft hover:text-accent"
      >
        ← 行事曆 / 待辦
      </Link>

      <header className="flex items-start justify-between mt-1 mb-6 gap-3">
        <h1 className="font-serif text-2xl">編輯代辦</h1>
        {canDelete && (
          <form action={deleteTodoAction}>
            <input type="hidden" name="id" value={todo.id} />
            <button
              type="submit"
              className="text-sm text-danger hover:underline"
            >
              刪除
            </button>
          </form>
        )}
      </header>

      <TodoEditForm
        todo={{
          id: todo.id,
          title: todo.title,
          body: todo.body,
          dueAt: todo.dueAt ? todo.dueAt.toISOString() : null,
          priority: todo.priority,
          isShared: todo.isShared,
          assigneeId: todo.assigneeId,
        }}
        admins={admins.map((a) => ({ id: a.id, name: a.name }))}
        action={boundUpdate}
      />
    </div>
  )
}
