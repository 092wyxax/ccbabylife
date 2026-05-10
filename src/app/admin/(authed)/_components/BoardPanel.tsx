import Link from 'next/link'
import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  announcements,
  announcementComments,
  announcementReads,
} from '@/db/schema/announcements'
import { adminUsers } from '@/db/schema/admin_users'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import type { AdminUser } from '@/db/schema'

const VISIBLE_ROWS = 6

export async function BoardPanel({ admin }: { admin: AdminUser }) {
  const rows = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      isPinned: announcements.isPinned,
      createdAt: announcements.createdAt,
      authorName: adminUsers.name,
      commentCount: sql<number>`(
        SELECT count(*)::int FROM ${announcementComments}
        WHERE ${announcementComments.announcementId} = ${announcements.id}
      )`,
      isRead: sql<boolean>`EXISTS (
        SELECT 1 FROM ${announcementReads}
        WHERE ${announcementReads.announcementId} = ${announcements.id}
          AND ${announcementReads.adminId} = ${admin.id}
      )`,
    })
    .from(announcements)
    .leftJoin(adminUsers, eq(announcements.authorId, adminUsers.id))
    .where(eq(announcements.orgId, DEFAULT_ORG_ID))
    .orderBy(desc(announcements.isPinned), desc(announcements.createdAt))
    .limit(VISIBLE_ROWS + 1)

  const visible = rows.slice(0, VISIBLE_ROWS)
  const hasMore = rows.length > VISIBLE_ROWS
  const canPost =
    admin.role === 'owner' || admin.role === 'manager' || admin.role === 'editor'

  return (
    <section className="bg-white border border-line rounded-lg overflow-hidden">
      <header className="px-5 sm:px-6 py-4 border-b border-line flex items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg">公告留言板</h2>
          <p className="text-xs text-ink-soft mt-0.5">
            內部公告、SOP 草稿、跨角色協作。
          </p>
        </div>
        {canPost && (
          <Link
            href="/admin/board/new"
            className="text-xs bg-ink text-cream px-3 py-1.5 rounded-md hover:bg-accent transition-colors whitespace-nowrap"
          >
            + 新公告
          </Link>
        )}
      </header>

      {visible.length === 0 ? (
        <div className="p-8 text-center text-ink-soft text-sm">
          還沒有任何公告。
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {visible.map((r) => (
            <li key={r.id}>
              <Link
                href={`/admin/board/${r.id}`}
                className="block px-5 sm:px-6 py-3 hover:bg-cream-100/40 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {r.isPinned && (
                    <span className="text-[10px] uppercase tracking-widest text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                      📌 置頂
                    </span>
                  )}
                  {!r.isRead && (
                    <span
                      className="w-2 h-2 rounded-full bg-accent"
                      aria-label="未讀"
                    />
                  )}
                  <h3
                    className={`text-sm leading-tight ${
                      !r.isRead ? 'font-medium' : 'text-ink-soft'
                    }`}
                  >
                    {r.title}
                  </h3>
                </div>
                <p className="text-[11px] text-ink-soft">
                  {r.authorName ?? '?'} ·{' '}
                  {new Date(r.createdAt).toLocaleString('zh-Hant', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                  {r.commentCount > 0 && ` · ${r.commentCount} 則回覆`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <div className="border-t border-line px-5 sm:px-6 py-2.5 text-right">
          <Link
            href="/admin/board"
            className="text-xs text-ink-soft hover:text-accent"
          >
            看全部 →
          </Link>
        </div>
      )}
    </section>
  )
}
