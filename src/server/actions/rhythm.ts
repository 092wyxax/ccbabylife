'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db/client'
import { rhythmCompletions, rhythmTasks } from '@/db/schema/rhythm'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireAdmin } from '@/server/services/AdminAuthService'
import { isoWeekStart, toDateStr, todayDateStr } from '@/lib/weekly-rhythm'

/**
 * Toggle a rhythm task's completion for the current admin in the period
 * containing `referenceDate` (defaults to today). Lets users mark completion
 * for past weeks while reviewing history.
 */
export async function toggleRhythmTaskAction(
  taskId: string,
  referenceDate?: string
): Promise<void> {
  const admin = await requireAdmin()

  const [task] = await db
    .select({ cadence: rhythmTasks.cadence, orgId: rhythmTasks.orgId })
    .from(rhythmTasks)
    .where(eq(rhythmTasks.id, taskId))
    .limit(1)
  if (!task) throw new Error('Unknown task')

  const periodStart = computePeriodStart(task.cadence, referenceDate)

  const existing = await db
    .select({ id: rhythmCompletions.id })
    .from(rhythmCompletions)
    .where(
      and(
        eq(rhythmCompletions.adminId, admin.id),
        eq(rhythmCompletions.taskId, taskId),
        eq(rhythmCompletions.periodStart, periodStart)
      )
    )
    .limit(1)

  if (existing[0]) {
    await db
      .delete(rhythmCompletions)
      .where(eq(rhythmCompletions.id, existing[0].id))
  } else {
    await db.insert(rhythmCompletions).values({
      orgId: DEFAULT_ORG_ID,
      adminId: admin.id,
      taskId,
      periodStart,
    })
  }

  revalidatePath('/admin')
}

function computePeriodStart(
  cadence: 'daily' | 'weekly',
  referenceDate: string | undefined
): string {
  if (cadence === 'daily') {
    if (referenceDate && /^\d{4}-\d{2}-\d{2}$/.test(referenceDate)) {
      return referenceDate
    }
    return todayDateStr()
  }
  // weekly: snap reference to its Monday
  const ref = referenceDate && /^\d{4}-\d{2}-\d{2}$/.test(referenceDate)
    ? new Date(`${referenceDate}T00:00:00`)
    : new Date()
  return toDateStr(isoWeekStart(ref))
}
