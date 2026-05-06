'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  taxRateGroups,
  clearanceFeePlans,
  agentServicePlans,
  paymentMethods,
} from '@/db/schema/procurement_settings'
import { sources } from '@/db/schema/sources'
import { categories } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireRole } from '@/server/services/AdminAuthService'

const ALLOWED = ['owner', 'manager', 'buyer'] as const

// ────────────── 採購來源 code（在 sources 表上） ──────────────
export async function updateSourceCodeAction(formData: FormData) {
  await requireRole([...ALLOWED])
  const id = String(formData.get('id') ?? '')
  const code = (String(formData.get('code') ?? '')).trim().toUpperCase().slice(0, 6) || null
  const notes = String(formData.get('notes') ?? '').trim() || null
  if (!id) return
  await db
    .update(sources)
    .set({ code, notes, updatedAt: new Date() })
    .where(and(eq(sources.orgId, DEFAULT_ORG_ID), eq(sources.id, id)))
  revalidatePath('/admin/procurement-settings')
}

// ────────────── 商品分類 code（在 categories 表上） ──────────────
export async function updateCategoryCodeAction(formData: FormData) {
  await requireRole([...ALLOWED])
  const id = String(formData.get('id') ?? '')
  const code = (String(formData.get('code') ?? '')).trim().toUpperCase().slice(0, 2) || null
  const notes = String(formData.get('notes') ?? '').trim() || null
  if (!id) return
  await db
    .update(categories)
    .set({ code, notes })
    .where(and(eq(categories.orgId, DEFAULT_ORG_ID), eq(categories.id, id)))
  revalidatePath('/admin/procurement-settings')
}

const taxSchema = z.object({
  name: z.string().min(1).max(60),
  importDutyRateBp: z.coerce.number().int().min(0).max(10000),
  notes: z.string().max(500).optional(),
})

export async function createTaxRateGroupAction(formData: FormData) {
  await requireRole([...ALLOWED])
  const parsed = taxSchema.safeParse({
    name: formData.get('name'),
    importDutyRateBp: formData.get('importDutyRateBp'),
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success) return
  await db.insert(taxRateGroups).values({
    orgId: DEFAULT_ORG_ID,
    name: parsed.data.name.trim(),
    importDutyRateBp: parsed.data.importDutyRateBp,
    notes: parsed.data.notes?.trim() || null,
  })
  revalidatePath('/admin/procurement-settings')
}

export async function updateTaxRateGroupAction(formData: FormData) {
  await requireRole([...ALLOWED])
  const id = String(formData.get('id') ?? '')
  const parsed = taxSchema.safeParse({
    name: formData.get('name'),
    importDutyRateBp: formData.get('importDutyRateBp'),
    notes: formData.get('notes') || undefined,
  })
  if (!id || !parsed.success) return
  await db
    .update(taxRateGroups)
    .set({
      name: parsed.data.name.trim(),
      importDutyRateBp: parsed.data.importDutyRateBp,
      notes: parsed.data.notes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(and(eq(taxRateGroups.orgId, DEFAULT_ORG_ID), eq(taxRateGroups.id, id)))
  revalidatePath('/admin/procurement-settings')
}

export async function deleteTaxRateGroupAction(formData: FormData) {
  await requireRole(['owner', 'manager'])
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await db
    .delete(taxRateGroups)
    .where(and(eq(taxRateGroups.orgId, DEFAULT_ORG_ID), eq(taxRateGroups.id, id)))
  revalidatePath('/admin/procurement-settings')
}

// ────────────── 報關方案 ──────────────
const clearSchema = z.object({
  name: z.string().min(1).max(60),
  amountTwd: z.coerce.number().int().min(0),
  notes: z.string().max(500).optional(),
})

export async function createClearanceFeePlanAction(formData: FormData) {
  await requireRole([...ALLOWED])
  const parsed = clearSchema.safeParse({
    name: formData.get('name'),
    amountTwd: formData.get('amountTwd'),
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success) return
  await db.insert(clearanceFeePlans).values({
    orgId: DEFAULT_ORG_ID,
    name: parsed.data.name.trim(),
    amountTwd: parsed.data.amountTwd,
    notes: parsed.data.notes?.trim() || null,
  })
  revalidatePath('/admin/procurement-settings')
}

export async function updateClearanceFeePlanAction(formData: FormData) {
  await requireRole([...ALLOWED])
  const id = String(formData.get('id') ?? '')
  const parsed = clearSchema.safeParse({
    name: formData.get('name'),
    amountTwd: formData.get('amountTwd'),
    notes: formData.get('notes') || undefined,
  })
  if (!id || !parsed.success) return
  await db
    .update(clearanceFeePlans)
    .set({
      name: parsed.data.name.trim(),
      amountTwd: parsed.data.amountTwd,
      notes: parsed.data.notes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(and(eq(clearanceFeePlans.orgId, DEFAULT_ORG_ID), eq(clearanceFeePlans.id, id)))
  revalidatePath('/admin/procurement-settings')
}

export async function deleteClearanceFeePlanAction(formData: FormData) {
  await requireRole(['owner', 'manager'])
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await db
    .delete(clearanceFeePlans)
    .where(and(eq(clearanceFeePlans.orgId, DEFAULT_ORG_ID), eq(clearanceFeePlans.id, id)))
  revalidatePath('/admin/procurement-settings')
}

// ────────────── 代購方案 ──────────────
const agentSchema = z.object({
  name: z.string().min(1).max(60),
  baseFeeTwd: z.coerce.number().int().min(0).default(0),
  handlingFeeTwd: z.coerce.number().int().min(0).default(0),
  notes: z.string().max(500).optional(),
})

export async function createAgentPlanAction(formData: FormData) {
  await requireRole([...ALLOWED])
  const parsed = agentSchema.safeParse({
    name: formData.get('name'),
    baseFeeTwd: formData.get('baseFeeTwd') || 0,
    handlingFeeTwd: formData.get('handlingFeeTwd') || 0,
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success) return
  await db.insert(agentServicePlans).values({
    orgId: DEFAULT_ORG_ID,
    name: parsed.data.name.trim(),
    baseFeeTwd: parsed.data.baseFeeTwd,
    handlingFeeTwd: parsed.data.handlingFeeTwd,
    notes: parsed.data.notes?.trim() || null,
  })
  revalidatePath('/admin/procurement-settings')
}

export async function updateAgentPlanAction(formData: FormData) {
  await requireRole([...ALLOWED])
  const id = String(formData.get('id') ?? '')
  const parsed = agentSchema.safeParse({
    name: formData.get('name'),
    baseFeeTwd: formData.get('baseFeeTwd') || 0,
    handlingFeeTwd: formData.get('handlingFeeTwd') || 0,
    notes: formData.get('notes') || undefined,
  })
  if (!id || !parsed.success) return
  await db
    .update(agentServicePlans)
    .set({
      name: parsed.data.name.trim(),
      baseFeeTwd: parsed.data.baseFeeTwd,
      handlingFeeTwd: parsed.data.handlingFeeTwd,
      notes: parsed.data.notes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(and(eq(agentServicePlans.orgId, DEFAULT_ORG_ID), eq(agentServicePlans.id, id)))
  revalidatePath('/admin/procurement-settings')
}

export async function deleteAgentPlanAction(formData: FormData) {
  await requireRole(['owner', 'manager'])
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await db
    .delete(agentServicePlans)
    .where(and(eq(agentServicePlans.orgId, DEFAULT_ORG_ID), eq(agentServicePlans.id, id)))
  revalidatePath('/admin/procurement-settings')
}

// ────────────── 付款方式 ──────────────
const paySchema = z.object({
  name: z.string().min(1).max(60),
  notes: z.string().max(500).optional(),
})

export async function createPaymentMethodAction(formData: FormData) {
  await requireRole([...ALLOWED])
  const parsed = paySchema.safeParse({
    name: formData.get('name'),
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success) return
  await db.insert(paymentMethods).values({
    orgId: DEFAULT_ORG_ID,
    name: parsed.data.name.trim(),
    notes: parsed.data.notes?.trim() || null,
  })
  revalidatePath('/admin/procurement-settings')
}

export async function updatePaymentMethodAction(formData: FormData) {
  await requireRole([...ALLOWED])
  const id = String(formData.get('id') ?? '')
  const parsed = paySchema.safeParse({
    name: formData.get('name'),
    notes: formData.get('notes') || undefined,
  })
  if (!id || !parsed.success) return
  await db
    .update(paymentMethods)
    .set({
      name: parsed.data.name.trim(),
      notes: parsed.data.notes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(and(eq(paymentMethods.orgId, DEFAULT_ORG_ID), eq(paymentMethods.id, id)))
  revalidatePath('/admin/procurement-settings')
}

export async function deletePaymentMethodAction(formData: FormData) {
  await requireRole(['owner', 'manager'])
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await db
    .delete(paymentMethods)
    .where(and(eq(paymentMethods.orgId, DEFAULT_ORG_ID), eq(paymentMethods.id, id)))
  revalidatePath('/admin/procurement-settings')
}
