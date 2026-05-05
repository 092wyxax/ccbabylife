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
import { requireAdmin } from '@/server/services/AdminAuthService'

export const dynamic = 'force-dynamic'

export default async function BoardPage() {
  const me = await requireAdmin()

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
          AND ${announcementReads.adminId} = ${me.id}
      )`,
    })
    .from(announcements)
    .leftJoin(adminUsers, eq(announcements.authorId, adminUsers.id))
    .where(eq(announcements.orgId, DEFAULT_ORG_ID))
    .orderBy(desc(announcements.isPinned), desc(announcements.createdAt))

  const canPost = me.role === 'owner' || me.role === 'manager' || me.role === 'editor'

  return (
    <div className="p-6 sm:p-8 max-w-4xl">
      <header className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-serif text-2xl mb-1">公告留言板</h1>
          <p className="text-ink-soft text-sm">
            內部公告、SOP 草稿、跨角色協作。所有管理員都看得到。
          </p>
        </div>
        {canPost && (
          <Link
            href="/admin/board/new"
            className="bg-ink text-cream px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors whitespace-nowrap"
          >
            + 發新公告
          </Link>
        )}
      </header>

      {rows.length === 0 ? (
        <div className="bg-white border border-line rounded-lg p-12 text-center">
          <p className="text-ink-soft text-sm">還沒有任何公告。</p>
        </div>
      ) : (
        <div className="bg-white border border-line rounded-lg overflow-hidden">
          {rows.map((r, i) => (
            <Link
              key={r.id}
              href={`/admin/board/${r.id}`}
              className={`block p-4 sm:p-5 ${
                i > 0 ? 'border-t border-line' : ''
              } hover:bg-cream-50/50 transition-colors`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {r.isPinned && (
                      <span className="text-[10px] uppercase tracking-widest text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                        📌 置頂
                      </span>
                    )}
                    {!r.isRead && (
                      <span className="w-2 h-2 rounded-full bg-accent" aria-label="未讀" />
                    )}
                    <h2 className={`text-base ${!r.isRead ? 'font-semibold' : 'font-normal'}`}>
                      {r.title}
                    </h2>
                  </div>
                  <p className="text-xs text-ink-soft">
                    {r.authorName ?? '?'} · {new Date(r.createdAt).toLocaleString('zh-Hant', { dateStyle: 'short', timeStyle: 'short' })}
                    {r.commentCount > 0 && ` · ${r.commentCount} 則回覆`}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
