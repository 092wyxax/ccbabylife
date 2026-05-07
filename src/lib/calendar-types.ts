/**
 * Shared calendar types + constants — safe to import from both
 * server components and client components. Pure data, no DB or
 * other server-only deps.
 */

export type CalendarEventType =
  | 'purchase'
  | 'order'
  | 'coupon'
  | 'post'
  | 'todo'
  | 'cron'

export const CALENDAR_TYPE_LABEL: Record<CalendarEventType, string> = {
  purchase: '進貨',
  order: '訂單',
  coupon: '優惠券',
  post: '部落格',
  todo: '待辦',
  cron: '排程',
}

export const CALENDAR_TYPE_COLOR: Record<CalendarEventType, string> = {
  purchase: 'bg-amber-100 text-amber-800 border-amber-200',
  order: 'bg-blue-100 text-blue-800 border-blue-200',
  coupon: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  post: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  todo: 'bg-ink/10 text-ink border-ink/20',
  cron: 'bg-slate-100 text-slate-700 border-slate-200',
}

export interface CalendarEvent {
  /** YYYY-MM-DD (Asia/Taipei) */
  date: string
  type: CalendarEventType
  subType: string
  title: string
  refUrl: string | null
  /** Unique identifier for React keys */
  sourceId: string
}
