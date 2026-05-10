import Link from 'next/link'
import { and, asc, eq, gte, lte } from 'drizzle-orm'
import { db } from '@/db/client'
import { rhythmCompletions, rhythmTasks } from '@/db/schema/rhythm'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import {
  RHYTHM_ROLE_LABEL,
  RHYTHM_ROLES,
  ISO_WEEKDAY_LABEL,
  defaultRhythmRole,
  isoWeekStart,
  toDateStr,
  todayIsoWeekday,
  todayDateStr,
  parseWeekParam,
  addDays,
  type RhythmRole,
} from '@/lib/weekly-rhythm'
import type { AdminUser } from '@/db/schema'
import { RhythmCheckbox } from './RhythmCheckbox'

function isValidRole(v: string | undefined): v is RhythmRole {
  return v === 'content' || v === 'system' || v === 'sourcing'
}

export async function WeeklyRhythm({
  admin,
  selectedRole,
  weekParam,
}: {
  admin: AdminUser
  selectedRole?: string
  weekParam?: string
}) {
  const role: RhythmRole = isValidRole(selectedRole)
    ? selectedRole
    : defaultRhythmRole(admin.role)

  // Resolve target week (defaults to this week's Monday)
  const weekStart = parseWeekParam(weekParam)
  const weekStartStr = toDateStr(weekStart)
  const weekEnd = addDays(weekStart, 6)
  const weekEndStr = toDateStr(weekEnd)

  const today = todayDateStr()
  const thisWeekStartStr = toDateStr(isoWeekStart())
  const isThisWeek = weekStartStr === thisWeekStartStr
  const todayDow = todayIsoWeekday()

  const prevWeekStr = toDateStr(addDays(weekStart, -7))
  const nextWeekStr = toDateStr(addDays(weekStart, 7))

  // Fetch active tasks for this role + completions for this week range
  const [activeTasks, weekCompletions] = await Promise.all([
    db
      .select()
      .from(rhythmTasks)
      .where(
        and(
          eq(rhythmTasks.orgId, DEFAULT_ORG_ID),
          eq(rhythmTasks.role, role),
          eq(rhythmTasks.isActive, true)
        )
      )
      .orderBy(asc(rhythmTasks.sort)),
    db
      .select({
        taskId: rhythmCompletions.taskId,
        periodStart: rhythmCompletions.periodStart,
      })
      .from(rhythmCompletions)
      .where(
        and(
          eq(rhythmCompletions.adminId, admin.id),
          gte(rhythmCompletions.periodStart, weekStartStr),
          lte(rhythmCompletions.periodStart, weekEndStr)
        )
      ),
  ])

  const doneSet = new Set(
    weekCompletions.map((c) => `${c.taskId}::${c.periodStart}`)
  )

  type Task = (typeof activeTasks)[number]

  function periodFor(task: Task, dayInWeek?: Date): string {
    if (task.cadence === 'daily') {
      return dayInWeek ? toDateStr(dayInWeek) : weekStartStr
    }
    return weekStartStr
  }

  function isDone(task: Task, dayInWeek?: Date): boolean {
    return doneSet.has(`${task.id}::${periodFor(task, dayInWeek)}`)
  }

  const dailyTasks = activeTasks.filter((t) => t.cadence === 'daily')
  const weeklyByDow = new Map<number, Task[]>()
  for (const t of activeTasks.filter((t) => t.cadence === 'weekly')) {
    const dow = t.weekday ?? 1
    if (!weeklyByDow.has(dow)) weeklyByDow.set(dow, [])
    weeklyByDow.get(dow)!.push(t)
  }

  // Aggregate completion: weekly tasks (1 each) + daily tasks (×7 days = total)
  const totalSlots =
    weeklyByDow.size > 0
      ? Array.from(weeklyByDow.values()).reduce((s, arr) => s + arr.length, 0)
      : 0
  const weeklySlots = activeTasks.filter((t) => t.cadence === 'weekly').length
  const dailySlots = dailyTasks.length * 7
  const allSlots = weeklySlots + dailySlots
  void totalSlots

  let doneSlots = 0
  for (const t of activeTasks) {
    if (t.cadence === 'weekly') {
      if (isDone(t)) doneSlots++
    } else {
      for (let i = 0; i < 7; i++) {
        if (isDone(t, addDays(weekStart, i))) doneSlots++
      }
    }
  }

  const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}–${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`

  return (
    <section className="bg-white border border-line rounded-lg overflow-hidden">
      <header className="px-5 sm:px-6 py-4 border-b border-line">
        <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row mb-3">
          <div>
            <h2 className="font-serif text-lg">本週節奏</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              依 PLAYBOOK §3–§5 的固定循環。
              <Link
                href="/admin/rhythm-tasks"
                className="text-accent hover:underline ml-1"
              >
                編輯任務 →
              </Link>
            </p>
          </div>
          <span className="text-xs text-ink-soft tabular-nums shrink-0">
            完成 {doneSlots}/{allSlots}
          </span>
        </div>

        {/* Week navigation */}
        <div className="flex items-center gap-2 text-xs">
          <Link
            href={`/admin?rhythm=${role}&week=${prevWeekStr}`}
            scroll={false}
            className="px-2.5 py-1 border border-line rounded-md hover:border-ink transition-colors"
            aria-label="上一週"
          >
            ← 上週
          </Link>
          <span className="px-2 py-1 tabular-nums">
            {weekLabel}
            {isThisWeek && <span className="text-accent ml-1">· 本週</span>}
          </span>
          <Link
            href={`/admin?rhythm=${role}&week=${nextWeekStr}`}
            scroll={false}
            className="px-2.5 py-1 border border-line rounded-md hover:border-ink transition-colors"
            aria-label="下一週"
          >
            下週 →
          </Link>
          {!isThisWeek && (
            <Link
              href={`/admin?rhythm=${role}`}
              scroll={false}
              className="px-2.5 py-1 text-ink-soft hover:text-ink transition-colors ml-1"
            >
              回到本週
            </Link>
          )}
        </div>
      </header>

      <nav className="flex border-b border-line bg-cream-100/40 text-sm">
        {RHYTHM_ROLES.map((r) => {
          const active = r === role
          return (
            <Link
              key={r}
              href={`/admin?rhythm=${r}${weekParam ? `&week=${weekParam}` : ''}`}
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
        {activeTasks.length === 0 && (
          <p className="text-sm text-ink-soft text-center py-6">
            這個分組還沒有任務。
            <Link
              href={`/admin/rhythm-tasks/new?role=${role}`}
              className="text-accent hover:underline ml-1"
            >
              新增第一個 →
            </Link>
          </p>
        )}

        {dailyTasks.length > 0 && (
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.25em] text-ink-soft mb-3">
              每日 · DAILY
            </h3>
            <ul className="space-y-3">
              {dailyTasks.map((task) => (
                <li key={task.id} className="border border-line/60 rounded-md p-3">
                  <p className="text-sm leading-snug mb-1">{task.label}</p>
                  {(task.timeHint || task.hint) && (
                    <p className="text-[11px] text-ink-soft mb-2">
                      {task.timeHint}
                      {task.timeHint && task.hint && ' · '}
                      {task.hint}
                    </p>
                  )}
                  <div className="flex items-center gap-1 flex-wrap">
                    {([0, 1, 2, 3, 4, 5, 6] as const).map((i) => {
                      const day = addDays(weekStart, i)
                      const dayStr = toDateStr(day)
                      const dow = (i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7
                      const done = isDone(task, day)
                      const isToday = isThisWeek && dayStr === today
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-1 px-1.5 py-1 rounded ${
                            isToday ? 'bg-accent/10' : ''
                          }`}
                        >
                          <RhythmCheckbox
                            taskId={task.id}
                            done={done}
                            referenceDate={dayStr}
                          />
                          <span
                            className={`text-[10px] ${
                              isToday ? 'text-accent font-medium' : 'text-ink-soft'
                            }`}
                          >
                            {ISO_WEEKDAY_LABEL[dow].slice(1)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {weeklyByDow.size > 0 && (
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.25em] text-ink-soft mb-3">
              每週 · WEEKLY
            </h3>
            <ul className="space-y-3">
              {([1, 2, 3, 4, 5, 6, 7] as const).map((dow) => {
                const tasks = weeklyByDow.get(dow) ?? []
                if (tasks.length === 0) return null
                const isTodayDow = isThisWeek && dow === todayDow
                return (
                  <li key={dow}>
                    <p
                      className={`text-[11px] tracking-wider mb-1.5 ${
                        isTodayDow ? 'text-accent font-medium' : 'text-ink-soft'
                      }`}
                    >
                      {ISO_WEEKDAY_LABEL[dow]}
                      {isTodayDow && ' · 今日'}
                    </p>
                    <ul className="space-y-2 pl-1">
                      {tasks.map((task) => {
                        const done = isDone(task)
                        return (
                          <li key={task.id} className="flex items-start gap-3 py-1.5">
                            <RhythmCheckbox
                              taskId={task.id}
                              done={done}
                              referenceDate={weekStartStr}
                            />
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
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
