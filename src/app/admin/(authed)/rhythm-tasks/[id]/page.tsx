import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { rhythmTasks } from '@/db/schema/rhythm'
import { requireRole } from '@/server/services/AdminAuthService'
import { updateRhythmTaskAction } from '@/server/actions/rhythm-tasks'
import { RhythmTaskForm } from '../RhythmTaskForm'
import type { RhythmRole, RhythmCadence } from '@/lib/weekly-rhythm'

export default async function EditRhythmTaskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole(['owner', 'manager'])
  const { id } = await params

  const [task] = await db
    .select()
    .from(rhythmTasks)
    .where(eq(rhythmTasks.id, id))
    .limit(1)

  if (!task) notFound()

  const updateAction = async (formData: FormData) => {
    'use server'
    await updateRhythmTaskAction(id, formData)
  }

  return (
    <div className="p-6 sm:p-8 max-w-2xl">
      <Link
        href="/admin/rhythm-tasks"
        className="text-xs text-ink-soft hover:text-accent mb-3 inline-block"
      >
        ← 返回列表
      </Link>
      <h1 className="font-serif text-2xl mb-6">編輯節奏任務</h1>
      <div className="bg-white border border-line rounded-lg p-6">
        <RhythmTaskForm
          action={updateAction}
          defaults={{
            role: task.role as RhythmRole,
            cadence: task.cadence as RhythmCadence,
            weekday: task.weekday,
            sort: task.sort,
            label: task.label,
            hint: task.hint,
            timeHint: task.timeHint,
          }}
          submitLabel="儲存變更"
        />
      </div>
    </div>
  )
}
