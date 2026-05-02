'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { experiments } from '@/db/schema/experiments'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireAdmin } from '@/server/services/AdminAuthService'

export type ExperimentActionState = { error?: string; success?: string }

const createSchema = z.object({
  key: z.string().regex(/^[a-z0-9-]+$/, 'key 僅小寫英數和短橫線'),
  name: z.string().min(1),
  description: z.string().optional(),
  variantsJson: z.string(),
})

const variantsSchema = z.array(
  z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    weight: z.number().int().nonnegative(),
  })
).min(2, '至少要 2 個變體')

export async function createExperimentAction(
  _prev: ExperimentActionState,
  formData: FormData
): Promise<ExperimentActionState> {
  await requireAdmin()
  const parsed = createSchema.safeParse({
    key: formData.get('key'),
    name: formData.get('name'),
    description: formData.get('description'),
    variantsJson: formData.get('variantsJson'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }

  let variants
  try {
    variants = variantsSchema.parse(JSON.parse(parsed.data.variantsJson))
  } catch (e) {
    return { error: '變體 JSON 格式錯誤：' + (e instanceof Error ? e.message : String(e)) }
  }

  await db.insert(experiments).values({
    orgId: DEFAULT_ORG_ID,
    key: parsed.data.key,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    variants,
    status: 'draft',
    isActive: false,
  })

  revalidatePath('/admin/experiments')
  return { success: '已新增實驗' }
}

export async function toggleExperimentActiveAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const [existing] = await db
    .select()
    .from(experiments)
    .where(and(eq(experiments.id, id), eq(experiments.orgId, DEFAULT_ORG_ID)))
    .limit(1)
  if (!existing) return

  const becomingActive = !existing.isActive
  await db
    .update(experiments)
    .set({
      isActive: becomingActive,
      status: becomingActive ? 'running' : 'paused',
      startedAt: becomingActive && !existing.startedAt ? new Date() : existing.startedAt,
      updatedAt: new Date(),
    })
    .where(eq(experiments.id, id))

  revalidatePath('/admin/experiments')
}
