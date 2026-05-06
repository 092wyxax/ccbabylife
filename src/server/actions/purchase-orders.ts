'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { purchases, purchaseItems } from '@/db/schema/purchases'
import {
  agentServicePlans,
  clearanceFeePlans,
  taxRateGroups,
} from '@/db/schema/procurement_settings'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireRole } from '@/server/services/AdminAuthService'
import {
  calcPurchase,
  type PurchaseHeader,
  type PurchaseItemInput,
} from '@/lib/procurement-calc'

const itemSchema = z.object({
  categoryId: z.string().uuid().optional().nullable(),
  taxRateGroupId: z.string().uuid().optional().nullable(),
  nameZh: z.string().min(1, '請填中文品名').max(200),
  nameJp: z.string().max(200).optional(),
  spec: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  qty: z.coerce.number().int().min(1),
  jpyUnitPrice: z.coerce.number().int().min(0),
})

const headerSchema = z.object({
  batchLabel: z.string().min(1, '請填採購單名稱').max(100),
  sourceId: z.string().uuid().optional().nullable(),
  purchaseDate: z.string().min(1, '請填採購日期'),
  exchangeRate: z.coerce.number().min(0).max(10),
  agentPlanId: z.string().uuid().optional().nullable(),
  clearanceFeePlanId: z.string().uuid().optional().nullable(),
  packagingFeeTotal: z.coerce.number().int().min(0).default(0),
  paymentMethodId: z.string().uuid().optional().nullable(),
  markupRatePct: z.coerce.number().min(0).max(500).default(30),
  priceRoundStrategy: z.enum(['A', 'B', 'C', 'D']).default('B'),
  notes: z.string().max(2000).optional(),
  items: z.array(itemSchema).min(1, '請至少加入一個明細'),
})

export type PurchaseOrderState = { error?: string }

function nullableId(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? '').trim()
  return s.length > 0 ? s : null
}

function parseForm(formData: FormData): {
  ok: true
  data: z.infer<typeof headerSchema>
} | { ok: false; error: string } {
  // Items come as parallel arrays
  const itemNames = formData.getAll('item.nameZh').map(String)
  const items = itemNames.map((nameZh, i) => ({
    categoryId: nullableId(formData.getAll('item.categoryId')[i]),
    taxRateGroupId: nullableId(formData.getAll('item.taxRateGroupId')[i]),
    nameZh,
    nameJp: String(formData.getAll('item.nameJp')[i] ?? ''),
    spec: String(formData.getAll('item.spec')[i] ?? ''),
    description: String(formData.getAll('item.description')[i] ?? ''),
    qty: formData.getAll('item.qty')[i],
    jpyUnitPrice: formData.getAll('item.jpyUnitPrice')[i],
  }))

  const parsed = headerSchema.safeParse({
    batchLabel: formData.get('batchLabel'),
    sourceId: nullableId(formData.get('sourceId')),
    purchaseDate: formData.get('purchaseDate'),
    exchangeRate: formData.get('exchangeRate'),
    agentPlanId: nullableId(formData.get('agentPlanId')),
    clearanceFeePlanId: nullableId(formData.get('clearanceFeePlanId')),
    packagingFeeTotal: formData.get('packagingFeeTotal') || 0,
    paymentMethodId: nullableId(formData.get('paymentMethodId')),
    markupRatePct: formData.get('markupRatePct') || 30,
    priceRoundStrategy: formData.get('priceRoundStrategy') || 'B',
    notes: formData.get('notes') || undefined,
    items,
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  }
  return { ok: true, data: parsed.data }
}

export async function createPurchaseOrderAction(
  _prev: PurchaseOrderState,
  formData: FormData
): Promise<PurchaseOrderState> {
  const me = await requireRole(['owner', 'manager', 'buyer'])

  const parsed = parseForm(formData)
  if (!parsed.ok) return { error: parsed.error }
  const data = parsed.data

  // Resolve plans + tax rates from DB to compute snapshot accurately
  const [agentPlan] = data.agentPlanId
    ? await db
        .select()
        .from(agentServicePlans)
        .where(
          and(
            eq(agentServicePlans.orgId, DEFAULT_ORG_ID),
            eq(agentServicePlans.id, data.agentPlanId)
          )
        )
        .limit(1)
    : [null]

  const [clearancePlan] = data.clearanceFeePlanId
    ? await db
        .select()
        .from(clearanceFeePlans)
        .where(
          and(
            eq(clearanceFeePlans.orgId, DEFAULT_ORG_ID),
            eq(clearanceFeePlans.id, data.clearanceFeePlanId)
          )
        )
        .limit(1)
    : [null]

  const taxIds = Array.from(
    new Set(data.items.map((it) => it.taxRateGroupId).filter(Boolean) as string[])
  )
  const taxGroups = taxIds.length
    ? await db
        .select()
        .from(taxRateGroups)
        .where(eq(taxRateGroups.orgId, DEFAULT_ORG_ID))
    : []
  const taxMap = new Map(taxGroups.map((t) => [t.id, t.importDutyRateBp]))

  const exchangeRateScaled = Math.round(data.exchangeRate * 100000)

  const header: PurchaseHeader = {
    exchangeRateScaled,
    agentBaseFeeTwd: agentPlan?.baseFeeTwd ?? 0,
    agentHandlingFeeTwd: agentPlan?.handlingFeeTwd ?? 0,
    clearanceFeeAmountTwd: clearancePlan?.amountTwd ?? 0,
    packagingFeeTotal: data.packagingFeeTotal,
    markupRateBp: Math.round(data.markupRatePct * 100),
    priceRoundStrategy: data.priceRoundStrategy,
  }

  const itemsForCalc: PurchaseItemInput[] = data.items.map((it) => ({
    qty: it.qty,
    jpyUnitPrice: it.jpyUnitPrice,
    importDutyRateBp: it.taxRateGroupId
      ? taxMap.get(it.taxRateGroupId) ?? 0
      : 0,
  }))

  const result = calcPurchase(header, itemsForCalc)

  // INSERT purchase + items in a single transaction-like sequence
  const [created] = await db
    .insert(purchases)
    .values({
      orgId: DEFAULT_ORG_ID,
      batchLabel: data.batchLabel.trim(),
      sourceId: data.sourceId ?? null,
      purchaseDate: data.purchaseDate,
      exchangeRateScaled,
      twdTotal: result.totals.twdTotal,
      expectedJpyTotal: result.totals.jpyTotal,
      agentPlanId: data.agentPlanId ?? null,
      clearanceFeePlanId: data.clearanceFeePlanId ?? null,
      packagingFeeTotal: data.packagingFeeTotal,
      paymentMethodId: data.paymentMethodId ?? null,
      markupRateBp: header.markupRateBp,
      priceRoundStrategy: data.priceRoundStrategy,
      notes: data.notes?.trim() || null,
      createdById: me.id,
      status: 'planning',
    })
    .returning()

  const itemRows = data.items.map((it, i) => {
    const c = result.items[i]
    return {
      orgId: DEFAULT_ORG_ID,
      purchaseId: created.id,
      productNameSnapshot: it.nameZh,
      categoryId: it.categoryId ?? null,
      taxRateGroupId: it.taxRateGroupId ?? null,
      nameZh: it.nameZh,
      nameJp: it.nameJp || null,
      spec: it.spec || null,
      description: it.description || null,
      quantity: it.qty,
      unitJpy: it.jpyUnitPrice,
      jpySubtotal: c.jpySubtotal,
      twdSubtotal: c.twdSubtotal,
      importDuty: c.importDuty,
      promoFee: c.promoFee,
      vat: c.vat,
      clearanceFeeShare: c.clearanceFeeShare,
      packagingFeeShare: c.packagingFeeShare,
      agentFeeShare: c.agentFeeShare,
      landedCostPerUnit: c.landedCostPerUnit,
      suggestedPriceRaw: c.suggestedPriceRaw,
      suggestedPrice: c.suggestedPrice,
    }
  })
  await db.insert(purchaseItems).values(itemRows)

  revalidatePath('/admin/purchases')
  redirect(`/admin/purchases/${created.id}`)
}
