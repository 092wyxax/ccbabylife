'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/server/services/AdminAuthService'
import {
  createPurchase,
  updatePurchase,
  changePurchaseStatus,
  addPurchaseItem,
  updatePurchaseItem,
  removePurchaseItem,
  createSupplier,
  InvalidPurchaseTransitionError,
} from '@/server/services/PurchaseService'
import { purchaseStatusEnum, supplierTypeEnum } from '@/db/schema/purchases'

export type ActionState = { error?: string; success?: string; fieldErrors?: Record<string, string> }

function fieldErrors(issues: z.ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of issues) {
    const path = issue.path.join('.')
    if (path && !out[path]) out[path] = issue.message
  }
  return out
}

const createPurchaseSchema = z.object({
  batchLabel: z.string().min(1, '請填批次標籤，例如 2026-W19 或 2026-05-12'),
  supplierId: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export async function createPurchaseAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin()
  const parsed = createPurchaseSchema.safeParse({
    batchLabel: formData.get('batchLabel'),
    supplierId: formData.get('supplierId') ?? '',
    notes: formData.get('notes') ?? '',
  })
  if (!parsed.success) {
    return { error: '輸入錯誤', fieldErrors: fieldErrors(parsed.error.issues) }
  }

  const purchase = await createPurchase({
    batchLabel: parsed.data.batchLabel,
    supplierId: parsed.data.supplierId || null,
    notes: parsed.data.notes || null,
    createdById: admin.id,
  })

  revalidatePath('/admin/purchases')
  redirect(`/admin/purchases/${purchase.id}`)
}

const updatePurchaseSchema = z.object({
  batchLabel: z.string().min(1),
  supplierId: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export async function updatePurchaseAction(
  purchaseId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin()
  const parsed = updatePurchaseSchema.safeParse({
    batchLabel: formData.get('batchLabel'),
    supplierId: formData.get('supplierId') ?? '',
    notes: formData.get('notes') ?? '',
  })
  if (!parsed.success) {
    return { error: '輸入錯誤', fieldErrors: fieldErrors(parsed.error.issues) }
  }

  await updatePurchase(purchaseId, {
    batchLabel: parsed.data.batchLabel,
    supplierId: parsed.data.supplierId || null,
    notes: parsed.data.notes || null,
  })

  revalidatePath('/admin/purchases')
  revalidatePath(`/admin/purchases/${purchaseId}`)
  return { success: '已儲存' }
}

const changeStatusSchema = z.object({
  toStatus: z.enum(purchaseStatusEnum),
})

export async function changePurchaseStatusAction(
  purchaseId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin()
  const parsed = changeStatusSchema.safeParse({ toStatus: formData.get('toStatus') })
  if (!parsed.success) return { error: '輸入錯誤' }

  try {
    await changePurchaseStatus(purchaseId, parsed.data.toStatus)
  } catch (e) {
    if (e instanceof InvalidPurchaseTransitionError) {
      return { error: `非法轉移：${e.from} → ${e.to}` }
    }
    return { error: e instanceof Error ? e.message : String(e) }
  }
  revalidatePath('/admin/purchases')
  revalidatePath(`/admin/purchases/${purchaseId}`)
  return { success: '狀態已更新' }
}

const addItemSchema = z.object({
  productId: z.string().uuid().optional().or(z.literal('')),
  productNameSnapshot: z.string().min(1, '請填品名'),
  quantity: z.coerce.number().int().positive(),
  unitJpy: z.coerce.number().int().nonnegative(),
  notes: z.string().optional().or(z.literal('')),
})

export async function addPurchaseItemAction(
  purchaseId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin()
  const parsed = addItemSchema.safeParse({
    productId: formData.get('productId') ?? '',
    productNameSnapshot: formData.get('productNameSnapshot'),
    quantity: formData.get('quantity'),
    unitJpy: formData.get('unitJpy'),
    notes: formData.get('notes') ?? '',
  })
  if (!parsed.success) {
    return { error: '輸入錯誤', fieldErrors: fieldErrors(parsed.error.issues) }
  }

  await addPurchaseItem(purchaseId, {
    productId: parsed.data.productId || null,
    productNameSnapshot: parsed.data.productNameSnapshot,
    quantity: parsed.data.quantity,
    unitJpy: parsed.data.unitJpy,
    notes: parsed.data.notes || null,
  })

  revalidatePath(`/admin/purchases/${purchaseId}`)
  return { success: '已新增項目' }
}

const updateItemSchema = z.object({
  quantity: z.coerce.number().int().positive(),
  unitJpy: z.coerce.number().int().nonnegative(),
  actualUnitJpy: z.coerce.number().int().nonnegative().optional(),
  notes: z.string().optional().or(z.literal('')),
})

export async function updatePurchaseItemAction(
  itemId: string,
  purchaseId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin()
  const parsed = updateItemSchema.safeParse({
    quantity: formData.get('quantity'),
    unitJpy: formData.get('unitJpy'),
    actualUnitJpy: formData.get('actualUnitJpy') || undefined,
    notes: formData.get('notes') ?? '',
  })
  if (!parsed.success) {
    return { error: '輸入錯誤' }
  }

  await updatePurchaseItem(itemId, {
    quantity: parsed.data.quantity,
    unitJpy: parsed.data.unitJpy,
    actualUnitJpy: parsed.data.actualUnitJpy ?? null,
    notes: parsed.data.notes || null,
  })

  revalidatePath(`/admin/purchases/${purchaseId}`)
  return { success: '已更新項目' }
}

export async function removePurchaseItemAction(
  itemId: string,
  purchaseId: string
): Promise<void> {
  await requireAdmin()
  await removePurchaseItem(itemId)
  revalidatePath(`/admin/purchases/${purchaseId}`)
}

const createSupplierSchema = z.object({
  name: z.string().min(1, '請填供應商名稱'),
  type: z.enum(supplierTypeEnum),
  contactInfo: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export async function createSupplierAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin()
  const parsed = createSupplierSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
    contactInfo: formData.get('contactInfo') ?? '',
    notes: formData.get('notes') ?? '',
  })
  if (!parsed.success) {
    return { error: '輸入錯誤', fieldErrors: fieldErrors(parsed.error.issues) }
  }

  await createSupplier({
    name: parsed.data.name,
    type: parsed.data.type,
    contactInfo: parsed.data.contactInfo || null,
    notes: parsed.data.notes || null,
  })

  revalidatePath('/admin/purchases')
  revalidatePath('/admin/purchases/suppliers')
  return { success: '已新增供應商' }
}
