/**
 * Weekly Operating Rhythm — utilities only.
 *
 * Tasks themselves live in the `rhythm_tasks` table (managed via
 * /admin/rhythm-tasks). This file holds week-math helpers and label maps.
 */
import type { AdminRole } from '@/db/schema/admin_users'
import type { RhythmRole, RhythmCadence } from '@/db/schema/rhythm'

export type { RhythmRole, RhythmCadence }

export const RHYTHM_ROLE_LABEL: Record<RhythmRole, string> = {
  content: '內容',
  system: '系統',
  sourcing: '採購',
}

export const RHYTHM_ROLES: RhythmRole[] = ['content', 'system', 'sourcing']

/** Map admin role → primary rhythm role (default tab). User can switch. */
export function defaultRhythmRole(role: AdminRole): RhythmRole {
  switch (role) {
    case 'owner':
      return 'system'
    case 'manager':
      return 'content'
    case 'editor':
      return 'content'
    case 'ops':
      return 'content'
    case 'buyer':
      return 'sourcing'
  }
}

/** ISO Monday-start week. Returns a UTC date at 00:00 representing the Monday. */
export function isoWeekStart(d: Date = new Date()): Date {
  const date = new Date(d)
  const day = date.getDay() // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day // shift to Monday
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

/** YYYY-MM-DD for a given Date (local). */
export function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Today as YYYY-MM-DD in local time. */
export function todayDateStr(): string {
  return toDateStr(new Date())
}

/** Today's ISO weekday (1=Mon … 7=Sun). */
export function todayIsoWeekday(): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  const d = new Date().getDay()
  return (d === 0 ? 7 : d) as 1 | 2 | 3 | 4 | 5 | 6 | 7
}

/** Parse YYYY-MM-DD → Date at local midnight. Falls back to today's week. */
export function parseWeekParam(raw: string | undefined): Date {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return isoWeekStart()
  const [y, m, d] = raw.split('-').map(Number)
  const date = new Date(y, m - 1, d, 0, 0, 0, 0)
  return isoWeekStart(date) // snap to Monday in case caller passed any day
}

/** Add days to a date (returns new Date). */
export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export const ISO_WEEKDAY_LABEL: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, string> = {
  1: '週一',
  2: '週二',
  3: '週三',
  4: '週四',
  5: '週五',
  6: '週六',
  7: '週日',
}

export const RHYTHM_CADENCE_LABEL: Record<RhythmCadence, string> = {
  daily: '每日',
  weekly: '每週',
}
