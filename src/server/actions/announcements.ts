'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  announcements,
  announcementComments,
  announcementReads,
} from '@/db/schema/announcements'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireRole, requireAdmin } from '@/server/services/AdminAuthService'

const createSchema = z.object({
  title: z.string().min(1, '請填標題').max(120),
  body: z.string().min(1, '請填內容').max(10000),
  isPinned: z.coerce.boolean().optional(),
})

export type AnnouncementFormState = { error?: string }

export async function createAnnouncementAction(
  _prev: AnnouncementFormState,
  formData: FormData
): Promise<AnnouncementFormState> {
  const me = await requireRole(['owner', 'manager', 'editor'])
  const parsed = createSchema.safeParse({
    title: formData.get('title'),
    body: formData.get('body'),
    isPinned: formData.get('isPinned') === 'on',
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  }

  // Only owner/manager may pin
  const isPinned =
    parsed.data.isPinned && (me.role === 'owner' || me.role === 'manager')

  await db.insert(announcements).values({
    orgId: DEFAULT_ORG_ID,
    authorId: me.id,
    title: parsed.data.title.trim(),
    body: parsed.data.body.trim(),
    isPinned: isPinned ?? false,
  })

  revalidatePath('/admin/board')
  redirect('/admin/board')
}

export async function updateAnnouncementAction(
  id: string,
  _prev: AnnouncementFormState,
  formData: FormData
): Promise<AnnouncementFormState> {
  const me = await requireRole(['owner', 'manager', 'editor'])

  const [existing] = await db
    .select()
    .from(announcements)
    .where(and(eq(announcements.orgId, DEFAULT_ORG_ID), eq(announcements.id, id)))
    .limit(1)
  if (!existing) return { error: '公告不存在' }

  // Author may always edit; otherwise must be owner/manager
  const canEdit =
    existing.authorId === me.id || me.role === 'owner' || me.role === 'manager'
  if (!canEdit) return { error: '無權編輯這則公告' }

  const parsed = createSchema.safeParse({
    title: formData.get('title'),
    body: formData.get('body'),
    isPinned: formData.get('isPinned') === 'on',
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  }

  const isPinned =
    parsed.data.isPinned && (me.role === 'owner' || me.role === 'manager')
      ? true
      : existing.isPinned

  await db
    .update(announcements)
    .set({
      title: parsed.data.title.trim(),
      body: parsed.data.body.trim(),
      isPinned: isPinned ?? false,
      updatedAt: new Date(),
    })
    .where(eq(announcements.id, id))

  revalidatePath('/admin/board')
  revalidatePath(`/admin/board/${id}`)
  redirect(`/admin/board/${id}`)
}

export async function deleteAnnouncementAction(id: string) {
  const me = await requireRole(['owner', 'manager'])

  await db
    .delete(announcements)
    .where(and(eq(announcements.orgId, DEFAULT_ORG_ID), eq(announcements.id, id)))

  // void me usage suppression
  void me

  revalidatePath('/admin/board')
  redirect('/admin/board')
}

const commentSchema = z.object({
  body: z.string().min(1, '回覆不能空白').max(5000),
})

export async function addCommentAction(
  announcementId: string,
  _prev: AnnouncementFormState,
  formData: FormData
): Promise<AnnouncementFormState> {
  const me = await requireAdmin()
  const parsed = commentSchema.safeParse({ body: formData.get('body') })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  }

  await db.insert(announcementComments).values({
    announcementId,
    authorId: me.id,
    body: parsed.data.body.trim(),
  })

  revalidatePath(`/admin/board/${announcementId}`)
  return {}
}

export async function deleteCommentAction(commentId: string, announcementId: string) {
  const me = await requireAdmin()

  const [comment] = await db
    .select()
    .from(announcementComments)
    .where(eq(announcementComments.id, commentId))
    .limit(1)
  if (!comment) return

  // Author or owner/manager may delete
  if (
    comment.authorId !== me.id &&
    me.role !== 'owner' &&
    me.role !== 'manager'
  ) {
    return
  }

  await db.delete(announcementComments).where(eq(announcementComments.id, commentId))
  revalidatePath(`/admin/board/${announcementId}`)
}

export async function markAsReadAction(announcementId: string) {
  const me = await requireAdmin()
  await db
    .insert(announcementReads)
    .values({ announcementId, adminId: me.id })
    .onConflictDoNothing()
}
