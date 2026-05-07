import Link from 'next/link'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
  addMonths,
  parse,
  isValid,
} from 'date-fns'
import { requireRole } from '@/server/services/AdminAuthService'
import {
  getCalendarEvents,
  listVisibleTodos,
  CALENDAR_TYPE_LABEL,
  CALENDAR_TYPE_COLOR,
  type CalendarEventType,
} from '@/server/services/CalendarEvents'
import { CalendarGrid } from './CalendarGrid'
import { TodoSection } from './TodoSection'

export const dynamic = 'force-dynamic'

const ALL_TYPES: CalendarEventType[] = [
  'todo',
  'purchase',
  'order',
  'coupon',
  'post',
  'cron',
]

interface SearchParams {
  m?: string // YYYY-MM
  t?: string // comma-separated types to show
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const me = await requireRole(['owner', 'manager', 'ops', 'buyer', 'editor'])
  const { m, t } = await searchParams

  const today = new Date()
  const parsedMonth = m
    ? parse(`${m}-01`, 'yyyy-MM-dd', new Date())
    : today
  const monthAnchor = isValid(parsedMonth) ? parsedMonth : today

  const monthStart = startOfMonth(monthAnchor)
  const monthEnd = endOfMonth(monthAnchor)
  const gridFrom = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridTo = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const enabledTypes = t
    ? (t.split(',').filter((x) => ALL_TYPES.includes(x as CalendarEventType)) as CalendarEventType[])
    : ALL_TYPES

  const [events, todos] = await Promise.all([
    getCalendarEvents({
      from: gridFrom,
      to: gridTo,
      types: enabledTypes,
      adminId: me.id,
      adminRole: me.role,
    }),
    listVisibleTodos(me.id, me.role),
  ])

  const monthLabel = format(monthAnchor, 'yyyy 年 M 月')
  const prevMonth = format(addMonths(monthAnchor, -1), 'yyyy-MM')
  const nextMonth = format(addMonths(monthAnchor, 1), 'yyyy-MM')

  const baseQs = (overrides: Partial<{ m: string; t: string }>) => {
    const params = new URLSearchParams()
    const useM = overrides.m ?? m
    const useT = overrides.t ?? t
    if (useM) params.set('m', useM)
    if (useT) params.set('t', useT)
    const s = params.toString()
    return s ? `?${s}` : ''
  }

  const toggleType = (type: CalendarEventType): string => {
    const cur = new Set(enabledTypes)
    if (cur.has(type)) cur.delete(type)
    else cur.add(type)
    const newT =
      cur.size === ALL_TYPES.length
        ? undefined
        : Array.from(cur).join(',')
    return baseQs({ t: newT })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <header className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl">行事曆 · 待辦</h1>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/admin/calendar${baseQs({ m: prevMonth })}`}
            className="px-2 py-1 border border-line rounded hover:bg-cream-50"
          >
            ←
          </Link>
          <span className="font-medium tabular-nums px-2">{monthLabel}</span>
          <Link
            href={`/admin/calendar${baseQs({ m: nextMonth })}`}
            className="px-2 py-1 border border-line rounded hover:bg-cream-50"
          >
            →
          </Link>
          <Link
            href={`/admin/calendar${baseQs({ m: format(today, 'yyyy-MM') })}`}
            className="ml-2 text-xs text-ink-soft hover:text-ink underline"
          >
            今日
          </Link>
        </div>
      </header>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {ALL_TYPES.map((tp) => {
          const on = enabledTypes.includes(tp)
          return (
            <Link
              key={tp}
              href={`/admin/calendar${toggleType(tp)}`}
              className={`text-xs px-2.5 py-1 rounded-full border ${
                on
                  ? CALENDAR_TYPE_COLOR[tp]
                  : 'bg-white text-ink-soft border-line opacity-50'
              }`}
            >
              {CALENDAR_TYPE_LABEL[tp]}
            </Link>
          )
        })}
      </div>

      <CalendarGrid
        events={events}
        gridFrom={gridFrom}
        gridTo={gridTo}
        currentMonth={monthAnchor}
      />

      <TodoSection
        todos={todos.map((t) => ({
          id: t.id,
          title: t.title,
          dueAt: t.dueAt ? t.dueAt.toISOString() : null,
          priority: t.priority,
          status: t.status,
          isShared: t.isShared,
          createdById: t.createdById,
          assigneeId: t.assigneeId,
        }))}
        currentAdminId={me.id}
      />
    </div>
  )
}
