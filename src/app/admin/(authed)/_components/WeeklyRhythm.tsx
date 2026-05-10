import Link from 'next/link'
import { and, eq, gte } from 'drizzle-orm'
import { db } from '@/db/client'
import { rhythmCompletions } from '@/db/schema/rhythm'
import {
  RHYTHM_TASKS,
  RHYTHM_ROLE_LABEL,
  ISO_WEEKDAY_LABEL,
  defaultRhythmRole,
  isoWeekStart,
  toDateStr,
  todayDateStr,
  todayIsoWeekday,
  type RhythmRole,
  type RhythmTask,
} from '@/lib/weekly-rhythm'
import type { AdminUser } from '@/db/schema'
import { RhythmCheckbox } from './RhythmCheckbox'

const ROLES: RhythmRole[] = ['wife', 'husband', 'friend']

function isValidRole(v: string | undefined): v is RhythmRole {
  return v === 'wife' || v === 'husband' || v === 'friend'
}

export async function WeeklyRhythm({
  admin,
  selectedRole,
}: {
  admin: AdminUser
  selectedRole?: string
}) {
  const role: RhythmRole = isValidRole(selectedRole)
    ? selectedRole
    : defaultRhythmRole(admin.role)

  const weekStart = isoWeekStart()
  const weekStartStr = toDateStr(weekStart)
  const today = todayDateStr()
  const todayDow = todayIsoWeekday()

  // Fetch completions for current admin since week start (covers daily this week + weekly this week)
  const myCompletions = await db
    .select({
      taskId: rhythmCompletions.taskId,
      periodStart: rhythmCompletions.periodStart,
    })
    .from(rhythmCompletions)
    .where(
      and(
        eq(rhythmCompletions.adminId, admin.id),
        gte(rhythmCompletions.periodStart, weekStartStr)
      )
    )

  const doneSet = new Set(
    myCompletions.map((c) => `${c.taskId}::${c.periodStart}`)
  )

  function isDone(task: RhythmTask): boolean {
    const period = task.cadence === 'daily' ? today : weekStartStr
    return doneSet.has(`${task.id}::${period}`)
  }

  const roleTasks = RHYTHM_TASKS.filter((t) => t.role === role).sort(
    (a, b) => a.sort - b.sort
  )

  const dailyTasks = roleTasks.filter((t) => t.cadence === 'daily')
  const weeklyByDow = new Map<number, RhythmTask[]>()
  for (const t of roleTasks.filter((t) => t.cadence === 'weekly')) {
    const dow = t.weekday ?? 1
    if (!weeklyByDow.has(dow)) weeklyByDow.set(dow, [])
    weeklyByDow.get(dow)!.push(t)
  }

  const totalThisWeek = roleTasks.length
  const doneThisWeek = roleTasks.filter(isDone).length

  return (
    <section className="bg-white border border-line rounded-lg overflow-hidden">
      <header className="px-5 sm:px-6 py-4 border-b border-line flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
        <div>
          <h2 className="font-serif text-lg">本週節奏</h2>
          <p className="text-xs text-ink-soft mt-0.5">
            依 PLAYBOOK §3–§5 的固定循環。任務本身不會變動，只記錄你的完成狀態。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-soft tabular-nums">
            本週 {doneThisWeek}/{totalThisWeek}
          </span>
        </div>
      </header>

      <nav className="flex border-b border-line bg-cream-100/40 text-sm">
        {ROLES.map((r) => {
          const active = r === role
          return (
            <Link
              key={r}
              href={`/admin?rhythm=${r}`}
              scroll={false}
              className={`flex-1 px-3 sm:px-5 py-3 text-center transition-colors ${
                active
                  ? 'bg-white text-ink font-medium border-b-2 border-accent -mb-px'
                  : 'text-ink-soft hover:text-ink hover:bg-white/60'
              }`}
            >
              {RHYTHM_ROLE_LABEL[r]}
            </Link>
          )
        })}
      </nav>

      <div className="p-5 sm:p-6 space-y-6">
        {dailyTasks.length > 0 && (
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.25em] text-ink-soft mb-3">
              每日 · DAILY
            </h3>
            <ul className="space-y-2">
              {dailyTasks.map((task) => {
                const done = isDone(task)
                return (
                  <li
                    key={task.id}
                    className="flex items-start gap-3 py-2 border-b border-line/40 last:border-b-0"
                  >
                    <RhythmCheckbox taskId={task.id} done={done} />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm leading-snug ${
                          done ? 'line-through text-ink-soft' : ''
                        }`}
                      >
                        {task.label}
                      </p>
                      {(task.timeHint || task.hint) && (
                        <p className="text-[11px] text-ink-soft mt-0.5">
                          {task.timeHint}
                          {task.timeHint && task.hint && ' · '}
                          {task.hint}
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <div>
          <h3 className="text-[11px] uppercase tracking-[0.25em] text-ink-soft mb-3">
            本週 · WEEKLY
          </h3>
          <ul className="space-y-3">
            {([1, 2, 3, 4, 5, 6, 7] as const).map((dow) => {
              const tasks = weeklyByDow.get(dow) ?? []
              if (tasks.length === 0) return null
              const isToday = dow === todayDow
              return (
                <li key={dow}>
                  <p
                    className={`text-[11px] tracking-wider mb-1.5 ${
                      isToday ? 'text-accent font-medium' : 'text-ink-soft'
                    }`}
                  >
                    {ISO_WEEKDAY_LABEL[dow]}
                    {isToday && ' · 今日'}
                  </p>
                  <ul className="space-y-2 pl-1">
                    {tasks.map((task) => {
                      const done = isDone(task)
                      return (
                        <li
                          key={task.id}
                          className="flex items-start gap-3 py-1.5"
                        >
                          <RhythmCheckbox taskId={task.id} done={done} />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm leading-snug ${
                                done ? 'line-through text-ink-soft' : ''
                              }`}
                            >
                              {task.label}
                            </p>
                            {task.hint && (
                              <p className="text-[11px] text-ink-soft mt-0.5">
                                {task.hint}
                              </p>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
