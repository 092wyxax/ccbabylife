'use client'

import { useState } from 'react'
import {
  RHYTHM_ROLE_LABEL,
  RHYTHM_ROLES,
  ISO_WEEKDAY_LABEL,
  type RhythmRole,
  type RhythmCadence,
} from '@/lib/weekly-rhythm'

export function RhythmTaskForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>
  defaults?: {
    role?: RhythmRole
    cadence?: RhythmCadence
    weekday?: number | null
    sort?: number
    label?: string
    hint?: string | null
    timeHint?: string | null
  }
  submitLabel: string
}) {
  const [cadence, setCadence] = useState<RhythmCadence>(
    defaults?.cadence ?? 'weekly'
  )

  return (
    <form action={action} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="分組" required>
          <select
            name="role"
            defaultValue={defaults?.role ?? 'content'}
            required
            className="w-full border border-line rounded-md px-3 py-2 text-sm bg-white"
          >
            {RHYTHM_ROLES.map((r) => (
              <option key={r} value={r}>
                {RHYTHM_ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="頻率" required>
          <select
            name="cadence"
            value={cadence}
            onChange={(e) => setCadence(e.target.value as RhythmCadence)}
            required
            className="w-full border border-line rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="weekly">每週固定某天</option>
            <option value="daily">每日</option>
          </select>
        </Field>
      </div>

      {cadence === 'weekly' && (
        <Field label="星期" required>
          <select
            name="weekday"
            defaultValue={defaults?.weekday ?? 1}
            required
            className="w-full sm:w-48 border border-line rounded-md px-3 py-2 text-sm bg-white"
          >
            {([1, 2, 3, 4, 5, 6, 7] as const).map((dow) => (
              <option key={dow} value={dow}>
                {ISO_WEEKDAY_LABEL[dow]}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="任務內容" required>
        <input
          name="label"
          type="text"
          required
          maxLength={200}
          defaultValue={defaults?.label ?? ''}
          placeholder="例如：寫 1 篇深度 IG 貼文"
          className="w-full border border-line rounded-md px-3 py-2 text-sm bg-white"
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="時間提示（可選）">
          <input
            name="timeHint"
            type="text"
            maxLength={100}
            defaultValue={defaults?.timeHint ?? ''}
            placeholder="例如：週一下午 / 每日 30 分鐘"
            className="w-full border border-line rounded-md px-3 py-2 text-sm bg-white"
          />
        </Field>

        <Field label="排序（數字越小越前面）">
          <input
            name="sort"
            type="number"
            defaultValue={defaults?.sort ?? 50}
            className="w-full border border-line rounded-md px-3 py-2 text-sm bg-white"
          />
        </Field>
      </div>

      <Field label="補充說明（可選）">
        <textarea
          name="hint"
          maxLength={500}
          rows={2}
          defaultValue={defaults?.hint ?? ''}
          placeholder="例如：4 育兒 ：3 上新 ：2 法規 ：1 限時"
          className="w-full border border-line rounded-md px-3 py-2 text-sm bg-white"
        />
      </Field>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="bg-ink text-cream px-5 py-2 rounded-md text-sm hover:bg-accent transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="text-xs text-ink-soft mb-1.5 block">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </span>
      {children}
    </label>
  )
}
