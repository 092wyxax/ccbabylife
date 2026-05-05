'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { sources, sourceTypeEnum, sourceStatusEnum } from '@/db/schema/sources'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireAdmin } from '@/server/services/AdminAuthService'

const baseSchema = z.object({
  name: z.string().min(1, '請填網站名稱').max(100),
  url: z.string().url('請填正確網址（含 https://）'),
  type: z.enum(sourceTypeEnum),
  strengths: z.string().max(500).optional(),
  status: z.enum(sourceStatusEnum),

  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  categories: z.array(z.string()).optional(),
  paymentMethods: z.array(z.string()).optional(),
  needsMembership: z.coerce.boolean().optional(),
  shipsOverseas: z.coerce.boolean().optional(),
  notes: z.string().max(2000).optional(),

  lastOrderedAt: z.string().optional(),
  avgProcessingDays: z.coerce.number().int().min(0).max(365).optional().nullable(),
  avgOrderJpy: z.coerce.number().int().min(0).optional().nullable(),
})

export type SourceFormState = {
  error?: string
  fieldErrors?: Partial<Record<keyof z.infer<typeof baseSchema>, string>>
}

function parse(formData: FormData) {
  return baseSchema.safeParse({
    name: formData.get('name'),
    url: formData.get('url'),
    type: formData.get('type'),
    strengths: formData.get('strengths') || undefined,
    status: formData.get('status'),
    rating: formData.get('rating') || undefined,
    categories: formData.getAll('categories').map(String).filter(Boolean),
    paymentMethods: formData.getAll('paymentMethods').map(String).filter(Boolean),
    needsMembership: formData.get('needsMembership') === 'on',
    shipsOverseas: formData.get('shipsOverseas') === 'on',
    notes: formData.get('notes') || undefined,
    lastOrderedAt: (formData.get('lastOrderedAt') as string) || undefined,
    avgProcessingDays: formData.get('avgProcessingDays') || undefined,
    avgOrderJpy: formData.get('avgOrderJpy') || undefined,
  })
}

function rowFromInput(data: z.infer<typeof baseSchema>) {
  return {
    name: data.name.trim(),
    url: data.url.trim(),
    type: data.type,
    strengths: data.strengths?.trim() || null,
    status: data.status,
    rating: data.rating ?? null,
    categories: data.categories ?? [],
    paymentMethods: data.paymentMethods ?? [],
    needsMembership: data.needsMembership ?? false,
    shipsOverseas: data.shipsOverseas ?? false,
    notes: data.notes?.trim() || null,
    lastOrderedAt: data.lastOrderedAt ? new Date(data.lastOrderedAt) : null,
    avgProcessingDays: data.avgProcessingDays ?? null,
    avgOrderJpy: data.avgOrderJpy ?? null,
  }
}

export async function createSourceAction(
  _prev: SourceFormState,
  formData: FormData
): Promise<SourceFormState> {
  await requireAdmin()
  const parsed = parse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  }
  await db.insert(sources).values({
    orgId: DEFAULT_ORG_ID,
    ...rowFromInput(parsed.data),
  })
  revalidatePath('/admin/sources')
  redirect('/admin/sources')
}

export async function updateSourceAction(
  id: string,
  _prev: SourceFormState,
  formData: FormData
): Promise<SourceFormState> {
  await requireAdmin()
  const parsed = parse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  }
  await db
    .update(sources)
    .set({ ...rowFromInput(parsed.data), updatedAt: new Date() })
    .where(and(eq(sources.orgId, DEFAULT_ORG_ID), eq(sources.id, id)))
  revalidatePath('/admin/sources')
  revalidatePath(`/admin/sources/${id}`)
  redirect('/admin/sources')
}

export async function deleteSourceAction(id: string) {
  await requireAdmin()
  await db
    .delete(sources)
    .where(and(eq(sources.orgId, DEFAULT_ORG_ID), eq(sources.id, id)))
  revalidatePath('/admin/sources')
  redirect('/admin/sources')
}
