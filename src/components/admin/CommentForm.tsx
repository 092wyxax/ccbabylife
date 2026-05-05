'use client'

import { useActionState, useRef, useEffect } from 'react'
import { addCommentAction, type AnnouncementFormState } from '@/server/actions/announcements'

interface Props {
  announcementId: string
}

export function CommentForm({ announcementId }: Props) {
  const ref = useRef<HTMLFormElement>(null)
  const boundAction = addCommentAction.bind(null, announcementId)
  const [state, formAction, pending] = useActionState<AnnouncementFormState, FormData>(
    boundAction,
    {}
  )

  // Clear textarea on successful submit (no error after pending)
  useEffect(() => {
    if (!pending && !state.error && ref.current) {
      const ta = ref.current.querySelector('textarea')
      if (ta) ta.value = ''
    }
  }, [pending, state.error])

  return (
    <form ref={ref} action={formAction} className="space-y-3">
      {state.error && (
        <div className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
          {state.error}
        </div>
      )}
      <textarea
        name="body"
        required
        rows={3}
        maxLength={5000}
        placeholder="留言⋯（Enter 換行，Cmd+Enter 送出）"
        className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink text-sm"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            ;(e.target as HTMLTextAreaElement).form?.requestSubmit()
          }
        }}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="bg-ink text-cream px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50"
        >
          {pending ? '送出中⋯' : '送出回覆'}
        </button>
      </div>
    </form>
  )
}
