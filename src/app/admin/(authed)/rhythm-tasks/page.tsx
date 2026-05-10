import Link from 'next/link'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { rhythmTasks } from '@/db/schema/rhythm'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireRole } from '@/server/services/AdminAuthService'
import {
  RHYTHM_ROLE_LABEL,
  RHYTHM_ROLES,
  ISO_WEEKDAY_LABEL,
  RHYTHM_CADENCE_LABEL,
  type RhythmRole,
} from '@/lib/weekly-rhythm'
import {
  deleteRhythmTaskAction,
  restoreRhythmTaskAction,
} from '@/server/actions/rhythm-tasks'

export const dynamic = 'force-dynamic'

interface SearchParams {
  show?: 'all' | 'active'
}

export default async function RhythmTasksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireRole(['owner', 'manager'])
  const { show = 'active' } = await searchParams

  const tasks = await db
    .select()
    .from(rhythmTasks)
    .where(
      show === 'all'
        ? eq(rhythmTasks.orgId, DEFAULT_ORG_ID)
        : and(
            eq(rhythmTasks.orgId, DEFAULT_ORG_ID),
            eq(rhythmTasks.isActive, true)
          )
    )
    .orderBy(asc(rhythmTasks.role), asc(rhythmTasks.cadence), asc(rhythmTasks.sort))

  // Group by role
  const grouped = new Map<RhythmRole, typeof tasks>()
  for (const r of RHYTHM_ROLES) grouped.set(r, [])
  for (const t of tasks) {
    grouped.get(t.role as RhythmRole)?.push(t)
  }

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <header className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl mb-1">節奏任務管理</h1>
          <p className="text-ink-soft text-sm">
            編輯本週節奏的固定任務。改動會立刻反映在
            <Link href="/admin" className="text-accent hover:underline mx-1">
              儀表板
            </Link>
            上。
          </p>
        </div>
        <Link
          href="/admin/rhythm-tasks/new"
          className="bg-ink text-cream px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors whitespace-nowrap"
        >
          + 新增任務
        </Link>
      </header>

      <div className="flex items-center gap-3 mb-5 text-xs">
        <Link
          href="/admin/rhythm-tasks"
          className={`px-3 py-1.5 rounded-md transition-colors ${
            show === 'active'
              ? 'bg-ink text-cream'
              : 'border border-line hover:border-ink'
          }`}
        >
          上線中
        </Link>
        <Link
          href="/admin/rhythm-tasks?show=all"
          className={`px-3 py-1.5 rounded-md transition-colors ${
            show === 'all'
              ? 'bg-ink text-cream'
              : 'border border-line hover:border-ink'
          }`}
        >
          全部（含已封存）
        </Link>
      </div>

      <div className="space-y-6">
        {RHYTHM_ROLES.map((role) => {
          const list = grouped.get(role) ?? []
          return (
            <section
              key={role}
              className="bg-white border border-line rounded-lg overflow-hidden"
            >
              <header className="px-5 py-3 border-b border-line bg-cream-100/40 flex items-center justify-between">
                <h2 className="font-medium text-sm">
                  {RHYTHM_ROLE_LABEL[role]}{' '}
                  <span className="text-ink-soft text-xs ml-1">
                    {list.filter((t) => t.isActive).length} 上線 ·{' '}
                    {list.filter((t) => !t.isActive).length} 封存
                  </span>
                </h2>
                <Link
                  href={`/admin/rhythm-tasks/new?role=${role}`}
                  className="text-xs text-ink-soft hover:text-accent"
                >
                  + 新增
                </Link>
              </header>

              {list.length === 0 ? (
                <p className="text-sm text-ink-soft text-center py-6">
                  還沒有任務。
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {list.map((t) => (
                    <li
                      key={t.id}
                      className={`px-5 py-3 flex items-start justify-between gap-3 ${
                        !t.isActive ? 'bg-cream-100/30' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] uppercase tracking-widest text-ink-soft bg-cream-100 px-1.5 py-0.5 rounded">
                            {RHYTHM_CADENCE_LABEL[t.cadence]}
                          </span>
                          {t.cadence === 'weekly' && t.weekday && (
                            <span className="text-[10px] uppercase tracking-widest text-ink-soft bg-cream-100 px-1.5 py-0.5 rounded">
                              {ISO_WEEKDAY_LABEL[t.weekday as 1 | 2 | 3 | 4 | 5 | 6 | 7]}
                            </span>
                          )}
                          {!t.isActive && (
                            <span className="text-[10px] uppercase tracking-widest text-warning bg-warning/15 px-1.5 py-0.5 rounded">
                              已封存
                            </span>
                          )}
                          <span className="text-[10px] text-ink-soft">
                            排序 {t.sort}
                          </span>
                        </div>
                        <p className={`text-sm ${!t.isActive ? 'text-ink-soft' : ''}`}>
                          {t.label}
                        </p>
                        {(t.timeHint || t.hint) && (
                          <p className="text-[11px] text-ink-soft mt-0.5">
                            {t.timeHint}
                            {t.timeHint && t.hint && ' · '}
                            {t.hint}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/admin/rhythm-tasks/${t.id}`}
                          className="text-xs text-ink-soft hover:text-accent"
                        >
                          編輯
                        </Link>
                        {t.isActive ? (
                          <form
                            action={async () => {
                              'use server'
                              await deleteRhythmTaskAction(t.id)
                            }}
                          >
                            <button
                              type="submit"
                              className="text-xs text-ink-soft hover:text-danger"
                            >
                              封存
                            </button>
                          </form>
                        ) : (
                          <form
                            action={async () => {
                              'use server'
                              await restoreRhythmTaskAction(t.id)
                            }}
                          >
                            <button
                              type="submit"
                              className="text-xs text-ink-soft hover:text-accent"
                            >
                              還原
                            </button>
                          </form>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
