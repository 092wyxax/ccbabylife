import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  announcements,
  announcementComments,
} from '@/db/schema/announcements'
import { adminUsers } from '@/db/schema/admin_users'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireAdmin } from '@/server/services/AdminAuthService'
import {
  deleteAnnouncementAction,
  deleteCommentAction,
  markAsReadAction,
} from '@/server/actions/announcements'
import { CommentForm } from '@/components/admin/CommentForm'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

const ROLE_LABEL: Record<string, string> = {
  owner: '店主',
  manager: '經理',
  ops: '客服',
  buyer: '採購',
  editor: '編輯',
}

export default async function AnnouncementPage({ params }: Props) {
  const { id } = await params
  const me = await requireAdmin()

  const [post] = await db
    .select({
      announcement: announcements,
      author: adminUsers,
    })
    .from(announcements)
    .leftJoin(adminUsers, eq(announcements.authorId, adminUsers.id))
    .where(and(eq(announcements.orgId, DEFAULT_ORG_ID), eq(announcements.id, id)))
    .limit(1)

  if (!post || !post.announcement) notFound()
  const a = post.announcement
  const author = post.author

  const comments = await db
    .select({
      comment: announcementComments,
      author: adminUsers,
    })
    .from(announcementComments)
    .leftJoin(adminUsers, eq(announcementComments.authorId, adminUsers.id))
    .where(eq(announcementComments.announcementId, a.id))
    .orderBy(asc(announcementComments.createdAt))

  // Mark as read (fire-and-forget)
  await markAsReadAction(a.id).catch(() => {})

  const canDelete = a.authorId === me.id || me.role === 'owner' || me.role === 'manager'
  const canEdit = canDelete || me.role === 'editor'

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      <Link href="/admin/board" className="text-xs text-ink-soft hover:text-accent">
        ← 公告留言板
      </Link>

      <article className="mt-3 mb-8">
        <header className="mb-4 pb-4 border-b border-line">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {a.isPinned && (
              <span className="text-[10px] uppercase tracking-widest text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                📌 置頂
              </span>
            )}
            <h1 className="font-serif text-2xl">{a.title}</h1>
          </div>
          <div className="flex items-center justify-between gap-3 text-xs text-ink-soft">
            <span>
              {author?.name ?? '?'}
              {author?.role && ` · ${ROLE_LABEL[author.role] ?? author.role}`}
              {' · '}
              {new Date(a.createdAt).toLocaleString('zh-Hant', { dateStyle: 'short', timeStyle: 'short' })}
            </span>
            <div className="flex items-center gap-3">
              {canEdit && (
                <Link
                  href={`/admin/board/${a.id}/edit`}
                  className="hover:text-accent"
                >
                  編輯
                </Link>
              )}
              {canDelete && (
                <form
                  action={async () => {
                    'use server'
                    await deleteAnnouncementAction(a.id)
                  }}
                >
                  <button
                    type="submit"
                    className="hover:text-danger"
                  >
                    刪除
                  </button>
                </form>
              )}
            </div>
          </div>
        </header>

        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {a.body}
        </div>
      </article>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-4">
          {comments.length} 則回覆
        </h2>

        {comments.length > 0 && (
          <ul className="space-y-3 mb-6">
            {comments.map(({ comment: c, author: ca }) => {
              const canDeleteComment = c.authorId === me.id || me.role === 'owner' || me.role === 'manager'
              return (
                <li key={c.id} className="bg-white border border-line rounded-md p-4">
                  <div className="flex items-center justify-between gap-3 text-xs text-ink-soft mb-2">
                    <span>
                      {ca?.name ?? '?'}
                      {ca?.role && ` · ${ROLE_LABEL[ca.role] ?? ca.role}`}
                      {' · '}
                      {new Date(c.createdAt).toLocaleString('zh-Hant', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                    {canDeleteComment && (
                      <form
                        action={async () => {
                          'use server'
                          await deleteCommentAction(c.id, a.id)
                        }}
                      >
                        <button type="submit" className="hover:text-danger">
                          刪除
                        </button>
                      </form>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {c.body}
                  </p>
                </li>
              )
            })}
          </ul>
        )}

        <CommentForm announcementId={a.id} />
      </section>
    </div>
  )
}
