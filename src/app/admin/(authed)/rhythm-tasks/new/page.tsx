import Link from 'next/link'
import { requireRole } from '@/server/services/AdminAuthService'
import { createRhythmTaskAction } from '@/server/actions/rhythm-tasks'
import { RhythmTaskForm } from '../RhythmTaskForm'
import type { RhythmRole } from '@/lib/weekly-rhythm'

interface SearchParams {
  role?: string
}

function isValidRole(v: string | undefined): v is RhythmRole {
  return v === 'content' || v === 'system' || v === 'sourcing'
}

export default async function NewRhythmTaskPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireRole(['owner', 'manager'])
  const { role } = await searchParams
  const defaultRole = isValidRole(role) ? role : 'content'

  return (
    <div className="p-6 sm:p-8 max-w-2xl">
      <Link
        href="/admin/rhythm-tasks"
        className="text-xs text-ink-soft hover:text-accent mb-3 inline-block"
      >
        ← 返回列表
      </Link>
      <h1 className="font-serif text-2xl mb-6">新增節奏任務</h1>
      <div className="bg-white border border-line rounded-lg p-6">
        <RhythmTaskForm
          action={createRhythmTaskAction}
          defaults={{ role: defaultRole, cadence: 'weekly', sort: 50 }}
          submitLabel="建立任務"
        />
      </div>
    </div>
  )
}
