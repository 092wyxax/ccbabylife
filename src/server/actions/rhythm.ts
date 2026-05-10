'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db/client'
import { rhythmCompletions } from '@/db/schema/rhythm'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireAdmin } from '@/server/services/AdminAuthService'
import { findTask, periodStartFor } from '@/lib/weekly-rhythm'

/**
 * Toggle a rhythm task's completion for the current admin in the current
 * period (today for daily tasks; this week for weekly tasks).
 *
 * Uses idempotent insert/delete on the unique (admin_id, task_id, period_start)
 * key — clicking again undoes the previous click.
 */
export async function toggleRhythmTaskAction(taskId: string): Promise<void> {
  const admin = await requireAdmin()
  const task = findTask(taskId)
  if (!task) throw new Error('Unknown task')

  const periodStart = periodStartFor(task)

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
