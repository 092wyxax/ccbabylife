import Link from 'next/link'
import type { ActivityEvent } from '@/server/services/CustomerActivity'

const KIND_ICON = {
  order: { dot: 'bg-accent', label: '訂單' },
  'coupon-used': { dot: 'bg-blush', label: '優惠券' },
  subscription: { dot: 'bg-sage', label: '訂閱' },
  signup: { dot: 'bg-seal', label: '加入' },
} as const

interface Props {
  events: ActivityEvent[]
}

export function ActivityTimeline({ events }: Props) {
  if (events.length === 0) {
    return (
      <p className="text-ink-soft text-sm py-6 text-center">尚無活動紀錄</p>
    )
  }

  return (
    <ol className="relative pl-6 space-y-5">
      {/* Vertical guide line */}
      <span
        aria-hidden
        className="absolute left-[7px] top-2 bottom-2 w-px bg-line"
      />
      {events.map((e, i) => {
        const meta = KIND_ICON[e.kind]
        const Inner = (
          <>
            <span
              aria-hidden
              className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-cream ${meta.dot}`}
            />
            <p className="font-jp text-[10px] tracking-[0.25em] text-ink-soft mb-0.5">
              {meta.label}
            </p>
            <p className="text-sm font-medium leading-tight">{e.title}</p>
            <p className="text-xs text-ink-soft mt-0.5">{e.detail}</p>
            <p className="text-[10px] text-ink-soft mt-1">
              {e.at.toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </>
        )
        return (
          <li key={i} className="relative">
            {e.href ? (
              <Link
                href={e.href}
                className="block hover:bg-cream-100 -mx-2 px-2 py-1 rounded-md transition-colors"
              >
                {Inner}
              </Link>
            ) : (
              <div className="-mx-2 px-2 py-1">{Inner}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
