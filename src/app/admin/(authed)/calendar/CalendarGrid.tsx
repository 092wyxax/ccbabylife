'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  addDays,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
} from 'date-fns'
import {
  CALENDAR_TYPE_COLOR,
  type CalendarEvent,
} from '@/server/services/CalendarEvents'

interface Props {
  events: CalendarEvent[]
  gridFrom: Date
  gridTo: Date
  currentMonth: Date
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export function CalendarGrid({ events, gridFrom, currentMonth }: Props) {
  const today = startOfDay(new Date())
  const [activeDay, setActiveDay] = useState<string | null>(null)

  // Build 6 weeks × 7 days
  const days: Date[] = []
  for (let i = 0; i < 42; i++) days.push(addDays(gridFrom, i))

  const eventsByDay = new Map<string, CalendarEvent[]>()
  for (const e of events) {
    const arr = eventsByDay.get(e.date) ?? []
    arr.push(e)
    eventsByDay.set(e.date, arr)
  }

  const activeDayEvents = activeDay ? eventsByDay.get(activeDay) ?? [] : []

  return (
    <>
      <div className="bg-white border border-line rounded-lg overflow-hidden mb-6">
        <div className="grid grid-cols-7 bg-cream-50 text-xs text-ink-soft border-b border-line">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-1 py-1.5 text-center font-medium">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-line">
          {days.map((d) => {
            const key = format(d, 'yyyy-MM-dd')
            const dayEvents = eventsByDay.get(key) ?? []
            const inMonth = isSameMonth(d, currentMonth)
            const isToday = isSameDay(d, today)
            const isActive = activeDay === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveDay(isActive ? null : key)}
                className={`min-h-[64px] sm:min-h-[100px] lg:min-h-[110px] bg-white text-left p-1 sm:p-1.5 transition-colors ${
                  inMonth ? '' : 'bg-cream-50/50'
                } ${isActive ? 'ring-2 ring-ink ring-inset' : ''} hover:bg-cream-50`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[11px] sm:text-xs ${
                      isToday
                        ? 'bg-ink text-cream w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-medium'
                        : inMonth
                        ? 'text-ink'
                        : 'text-ink-soft/60'
                    }`}
                  >
                    {format(d, 'd')}
                  </span>
                </div>

                {/* Mobile: dots */}
                <div className="flex flex-wrap gap-0.5 sm:hidden">
                  {dayEvents.slice(0, 5).map((e) => (
                    <span
                      key={e.sourceId}
                      className={`w-1.5 h-1.5 rounded-full ${dotColor(e.type)}`}
                      aria-label={e.title}
                    />
                  ))}
                  {dayEvents.length > 5 && (
                    <span className="text-[9px] text-ink-soft">+{dayEvents.length - 5}</span>
                  )}
                </div>

                {/* Tablet+: pills */}
                <div className="hidden sm:block space-y-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <div
                      key={e.sourceId}
                      className={`text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded border truncate ${
                        CALENDAR_TYPE_COLOR[e.type]
                      }`}
                      title={e.title}
                    >
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-ink-soft px-1">
                      + {dayEvents.length - 3} 更多
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day detail panel */}
      {activeDay && (
        <div className="bg-white border border-line rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-sm">
              {format(new Date(activeDay), 'yyyy 年 M 月 d 日（EEEE）')}
            </h2>
            <button
              type="button"
              onClick={() => setActiveDay(null)}
              className="text-xs text-ink-soft hover:text-ink"
            >
              關閉
            </button>
          </div>
          {activeDayEvents.length === 0 ? (
            <p className="text-sm text-ink-soft text-center py-4">當日無事件</p>
          ) : (
            <ul className="space-y-2">
              {activeDayEvents.map((e) => (
                <li key={e.sourceId} className="flex items-center gap-2 text-sm">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${CALENDAR_TYPE_COLOR[e.type]}`}
                  >
                    {e.subType}
                  </span>
                  {e.refUrl ? (
                    <Link href={e.refUrl} className="hover:text-accent flex-1 truncate">
                      {e.title}
                    </Link>
                  ) : (
                    <span className="flex-1 truncate text-ink-soft">{e.title}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  )
}

function dotColor(type: CalendarEvent['type']): string {
  switch (type) {
    case 'todo':
      return 'bg-ink'
    case 'purchase':
      return 'bg-amber-500'
    case 'order':
      return 'bg-blue-500'
    case 'coupon':
      return 'bg-fuchsia-500'
    case 'post':
      return 'bg-emerald-500'
    case 'cron':
      return 'bg-slate-400'
  }
}
