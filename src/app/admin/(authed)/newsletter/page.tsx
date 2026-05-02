import { desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { newsletterSubscribers } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

export default async function NewsletterAdminPage() {
  const [rows, agg] = await Promise.all([
    db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.orgId, DEFAULT_ORG_ID))
      .orderBy(desc(newsletterSubscribers.createdAt))
      .limit(200),
    db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where ${newsletterSubscribers.isActive})::int`,
      })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.orgId, DEFAULT_ORG_ID)),
  ])

  return (
    <div className="p-8 max-w-4xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl mb-1">電子報訂閱者</h1>
        <p className="text-ink-soft text-sm">
          總計 {agg[0].total} 人 · 目前訂閱中 {agg[0].active} 人
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="bg-white border border-line rounded-lg p-12 text-center text-ink-soft">
          目前還沒有訂閱者。
        </div>
      ) : (
        <div className="bg-white border border-line rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-ink-soft">
              <tr>
                <th className="text-left px-4 py-3 font-normal">Email</th>
                <th className="text-left px-4 py-3 font-normal">來源</th>
                <th className="text-left px-4 py-3 font-normal">狀態</th>
                <th className="text-left px-4 py-3 font-normal">建立日期</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-t border-line">
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3 text-xs text-ink-soft">{s.source ?? '—'}</td>
                  <td className="px-4 py-3">
                    {s.isActive ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-success/15 text-ink">
                        訂閱中
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-ink/10 text-ink-soft">
                        已退訂
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft text-xs">
                    {new Date(s.createdAt).toLocaleString('zh-TW')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
