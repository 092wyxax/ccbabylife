'use client'

import { useActionState, useState } from 'react'
import { useActionToast } from '@/hooks/useActionToast'
import {
  createExperimentAction,
  type ExperimentActionState,
} from '@/server/actions/experiments'

const initial: ExperimentActionState = {}

const DEFAULT_VARIANTS = JSON.stringify(
  [
    { key: 'A', label: 'Control', weight: 50 },
    { key: 'B', label: 'Treatment', weight: 50 },
  ],
  null,
  2
)

export function ExperimentAddForm() {
  const [state, formAction, pending] = useActionState(createExperimentAction, initial)
  useActionToast(state)

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label htmlFor="key" className="block text-xs text-ink-soft mb-1">
          實驗 key（小寫英數）<span className="text-danger">*</span>
        </label>
        <input
          id="key"
          name="key"
          required
          placeholder="hero-cta-2026q2"
          className="w-full border border-line rounded-md px-2 py-1 text-sm font-mono"
        />
      </div>
      <div>
        <label htmlFor="name" className="block text-xs text-ink-soft mb-1">
          顯示名稱 <span className="text-danger">*</span>
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="首頁 Hero CTA 文案測試"
          className="w-full border border-line rounded-md px-2 py-1 text-sm"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-xs text-ink-soft mb-1">
          描述
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          className="w-full border border-line rounded-md px-2 py-1 text-sm"
        />
      </div>
      <div>
        <label htmlFor="variantsJson" className="block text-xs text-ink-soft mb-1">
          變體（JSON 陣列）
        </label>
        <textarea
          id="variantsJson"
          name="variantsJson"
          rows={6}
          required
          defaultValue={DEFAULT_VARIANTS}
          className="w-full border border-line rounded-md px-2 py-1 text-xs font-mono"
        />
        <p className="text-xs text-ink-soft mt-1">
          weight 權重決定分流比例。建立後預設停用，需手動啟用。
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-ink text-cream px-4 py-2 rounded-md text-sm hover:bg-accent disabled:opacity-50"
      >
        {pending ? '新增中⋯' : '新增實驗'}
      </button>
    </form>
  )
}
