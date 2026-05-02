'use client'

import { useActionState } from 'react'
import {
  subscribeNewsletterAction,
  type SubscribeState,
} from '@/server/actions/newsletter'

const initial: SubscribeState = {}

interface Props {
  source?: string
}

export function NewsletterForm({ source = 'footer' }: Props) {
  const [state, formAction, pending] = useActionState(subscribeNewsletterAction, initial)

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="source" value={source} />
      <div className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="妳的 email"
          className="flex-1 border border-line rounded-md px-3 py-2 text-sm bg-cream focus:outline-none focus:border-ink"
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-ink text-cream px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {pending ? '⋯' : '訂閱'}
        </button>
      </div>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
      {state.success && <p className="text-xs text-success">{state.success}</p>}
    </form>
  )
}
