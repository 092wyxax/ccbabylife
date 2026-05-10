'use client'

import { useTransition } from 'react'
import { toggleRhythmTaskAction } from '@/server/actions/rhythm'

export function RhythmCheckbox({
  taskId,
  done,
  referenceDate,
}: {
  taskId: string
  done: boolean
  /** YYYY-MM-DD — toggle completion for the period containing this date */
  referenceDate?: string
}) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleRhythmTaskAction(taskId, referenceDate)
        })
      }
      aria-label={done ? '取消完成' : '標記完成'}
      className={`shrink-0 w-5 h-5 rounded border transition-colors flex items-center justify-center ${
        done
          ? 'bg-accent border-accent text-cream'
          : 'bg-white border-line hover:border-ink'
      } ${pending ? 'opacity-50' : ''}`}
    >
      {done && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 6.5L4.5 9L10 3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}
