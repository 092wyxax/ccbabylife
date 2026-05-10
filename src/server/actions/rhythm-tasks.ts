'use server'

import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/db/client'
import { rhythmTasks, rhythmRoleEnum, rhythmCadenceEnum } from '@/db/schema/rhythm'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireRole } from '@/server/services/AdminAuthService'

const baseSchema = z.object({
  role: z.enum(rhythmRoleEnum),
  cadence: z.enum(rhythmCadenceEnum),
  weekday: z.coerce.number().int().min(1).max(7).optional().nullable(),
  sort: z.coerce.number().int().default(0),
  label: z.string().trim().min(1, '請輸入任務內容').max(200),
  hint: z.string().trim().max(500).optional().or(z.literal('')),
  timeHint: z.string().trim().max(100).optional().or(z.literal('')),
})

function parseForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries())
  // weekday only meaningful for weekly cadence
  const parsed = baseSchema.parse({
    ...raw,
    weekday: raw.cadence === 'weekly' ? raw.weekday : null,
  })
  return {
    role: parsed.role,
    cadence: parsed.cadence,
    weekday: parsed.cadence === 'weekly' ? (parsed.weekday ?? 1) : null,
    sort: parsed.sort,
    label: parsed.label,
    hint: parsed.hint && parsed.hint.length > 0 ? parsed.hint : null,
    timeHint:
      parsed.timeHint && parsed.timeHint.length > 0 ? parsed.timeHint : null,
  }
}

export async function createRhythmTaskAction(formData: FormData): Promise<void> {
  await requireRole(['owner', 'manager'])
  const data = parseForm(formData)
  await db.insert(rhythmTasks).values({
    orgId: DEFAULT_ORG_ID,
    ...data,
  })
  revalidatePath('/admin')
  revalidatePath('/admin/rhythm-tasks')
  redirect('/admin/rhythm-tasks')
}

export async function updateRhythmTaskAction(
  id: string,
  formData: FormData
): Promise<void> {
  await requireRole(['owner', 'manager'])
  const data = parseForm(formData)
  await db
    .update(rhythmTasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(rhythmTasks.id, id))
  revalidatePath('/admin')
  revalidatePath('/admin/rhythm-tasks')
  redirect('/admin/rhythm-tasks')
}

export async function deleteRhythmTaskAction(id: string): Promise<void> {
  await requireRole(['owner', 'manager'])
  // Soft-delete so historical completions stay queryable
  await db
    .update(rhythmTasks)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(rhythmTasks.id, id))
  revalidatePath('/admin')
  revalidatePath('/admin/rhythm-tasks')
}

export async function restoreRhythmTaskAction(id: string): Promise<void> {
  await requireRole(['owner', 'manager'])
  await db
    .update(rhythmTasks)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(rhythmTasks.id, id))
  revalidatePath('/admin')
  revalidatePath('/admin/rhythm-tasks')
}
