'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { todos, todoPriorityEnum } from '@/db/schema/todos'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireRole } from '@/server/services/AdminAuthService'

const ALLOWED = ['owner', 'manager', 'ops', 'buyer', 'editor'] as const

const baseSchema = z.object({
  title: z.string().min(1, '請填標題').max(200),
  body: z.string().max(2000).optional(),
  dueAt: z.string().optional(),
  priority: z.enum(todoPriorityEnum).default('normal'),
  isShared: z.coerce.boolean().optional(),
  assigneeId: z.string().uuid().optional().nullable(),
})

export type TodoFormState = { error?: string }

function nullable(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? '').trim()
  return s.length > 0 ? s : null
}

function parseTodoForm(formData: FormData) {
  return baseSchema.safeParse({
    title: formData.get('title'),
    body: formData.get('body') || undefined,
    dueAt: nullable(formData.get('dueAt')) || undefined,
    priority: formData.get('priority') || 'normal',
    isShared: formData.get('isShared') === 'on',
    assigneeId: nullable(formData.get('assigneeId')),
  })
}

async function loadTodo(id: string) {
  const [row] = await db
    .select()
    .from(todos)
    .where(and(eq(todos.orgId, DEFAULT_ORG_ID), eq(todos.id, id)))
    .limit(1)
  return row ?? null
}

function canModify(
  todo: { createdById: string; assigneeId: string | null },
  meId: string,
  role: string
): boolean {
  if (role === 'owner' || role === 'manager') return true
  if (todo.createdById === meId) return true
  if (todo.assigneeId === meId) return true
  return false
}

export async function createTodoAction(
  _prev: TodoFormState,
  formData: FormData
): Promise<TodoFormState> {
  const me = await requireRole([...ALLOWED])

  const parsed = parseTodoForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  }
  const data = parsed.data

  // 共用 todo: assignee = null
  // 個人 todo without assignee: assign to me
  const finalAssigneeId = data.isShared
    ? null
    : data.assigneeId ?? me.id

  await db.insert(todos).values({
    orgId: DEFAULT_ORG_ID,
    title: data.title.trim(),
    body: data.body?.trim() || null,
    dueAt: data.dueAt ? new Date(data.dueAt) : null,
    priority: data.priority,
    isShared: data.isShared ?? false,
    assigneeId: finalAssigneeId,
    createdById: me.id,
    status: 'open',
  })

  revalidatePath('/admin/calendar')
  return {}
}

export async function toggleTodoDoneAction(formData: FormData): Promise<void> {
  const me = await requireRole([...ALLOWED])
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const existing = await loadTodo(id)
  if (!existing) return
  if (!canModify(existing, me.id, me.role)) return

  const toDone = existing.status !== 'done'
  await db
    .update(todos)
    .set({
      status: toDone ? 'done' : 'open',
      completedAt: toDone ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(todos.id, id))

  revalidatePath('/admin/calendar')
  revalidatePath(`/admin/calendar/todos/${id}`)
}

export async function updateTodoAction(
  id: string,
  _prev: TodoFormState,
  formData: FormData
): Promise<TodoFormState> {
  const me = await requireRole([...ALLOWED])
  const existing = await loadTodo(id)
  if (!existing) return { error: '找不到此代辦' }
  if (!canModify(existing, me.id, me.role)) return { error: '無權編輯' }

  const parsed = parseTodoForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  }
  const data = parsed.data

  const finalAssigneeId = data.isShared ? null : data.assigneeId ?? me.id

  await db
    .update(todos)
    .set({
      title: data.title.trim(),
      body: data.body?.trim() || null,
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      priority: data.priority,
      isShared: data.isShared ?? false,
      assigneeId: finalAssigneeId,
      updatedAt: new Date(),
    })
    .where(eq(todos.id, id))

  revalidatePath('/admin/calendar')
  revalidatePath(`/admin/calendar/todos/${id}`)
  redirect('/admin/calendar')
}

export async function deleteTodoAction(formData: FormData): Promise<void> {
  const me = await requireRole([...ALLOWED])
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const existing = await loadTodo(id)
  if (!existing) return

  // delete: creator OR owner/manager
  const allowed =
    existing.createdById === me.id ||
    me.role === 'owner' ||
    me.role === 'manager'
  if (!allowed) return

  await db.delete(todos).where(eq(todos.id, id))

  revalidatePath('/admin/calendar')
}

