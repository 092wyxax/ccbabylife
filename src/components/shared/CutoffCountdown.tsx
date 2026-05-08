'use client'

import { useEffect, useState } from 'react'
import { nextCutoffDate } from '@/lib/cutoff'

interface Props {
  variant?: 'banner' | 'inline'
}

export function CutoffCountdown({ variant = 'banner' }: Props) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (!now) return null

  const cutoff = nextCutoffDate(now)
  const diffMs = cutoff.getTime() - now.getTime()
  const totalMin = Math.max(0, Math.floor(diffMs / 60_000))
  const days = Math.floor(totalMin / (24 * 60))
  const hours = Math.floor((totalMin % (24 * 60)) / 60)
  const minutes = totalMin % 60

  const text =
    days > 0
      ? `${days} 天 ${hours} 小時`
      : hours > 0
      ? `${hours} 小時 ${minutes} 分鐘`
      : `${minutes} 分鐘`

  const isUrgent = days === 0 && hours < 12

  if (variant === 'inline') {
    return (
      <span
        className={
          'text-xs font-jp tracking-wider ' + (isUrgent ? 'text-warning font-medium' : 'text-ink-soft')
        }
      >
        今週の締切まで {text}
      </span>
    )
  }

  return (
    <div
      className={
        'text-center text-sm py-2.5 px-4 font-jp tracking-[0.2em] ' +
        (isUrgent
          ? 'bg-blush-soft text-ink border-b border-blush'
          : 'bg-cream-100 text-ink-soft border-b border-line')
      }
    >
      今週の予約締切まで <strong className="text-ink">{text}</strong>
      {isUrgent && <span className="text-seal"> · お早めに</span>}
    </div>
  )
}
