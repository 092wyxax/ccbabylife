'use client'

import { useActionState } from 'react'
import type { Announcement } from '@/db/schema/announcements'
import type { AnnouncementFormState } from '@/server/actions/announcements'

interface Props {
  announcement?: Announcement
  action: (
    prev: AnnouncementFormState,
    formData: FormData
  ) => Promise<AnnouncementFormState>
  submitLabel: string
  canPin: boolean
}

export function AnnouncementForm({
  announcement,
  action,
  submitLabel,
  canPin,
}: Props) {
  const [state, formAction, pending] = useActionState<AnnouncementFormState, FormData>(
    action,
    {}
  )

  return (
    <form action={formAction} className="space-y-5 max-w-3xl">
      {state.error && (
        <div className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm mb-1.5 text-ink-soft">
          標題 <span className="text-danger">*</span>
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={120}
          defaultValue={announcement?.title ?? ''}
          placeholder="例：3/3 新春活動文案請編輯校稿"
          className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm mb-1.5 text-ink-soft">
          內容 <span className="text-danger">*</span>
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={10}
          maxLength={10000}
          defaultValue={announcement?.body ?? ''}
          placeholder="可貼長文。同事看到後可在底下留言回覆。"
          className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink font-mono text-sm leading-relaxed"
        />
        <p className="text-xs text-ink-soft mt-1">最多 10000 字</p>
      </div>

      {canPin && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isPinned"
            defaultChecked={announcement?.isPinned ?? false}
            className="w-4 h-4"
          />
          📌 置頂（顯示於列表最上方）
        </label>
      )}

      <div className="flex gap-3 pt-2 border-t border-line">
        <button
          type="submit"
          disabled={pending}
          className="bg-ink text-cream px-5 py-2.5 rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50"
        >
          {pending ? '儲存中⋯' : submitLabel}
        </button>
      </div>
    </form>
  )
}
