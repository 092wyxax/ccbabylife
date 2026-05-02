import 'server-only'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  suppliers,
  purchases,
  purchaseItems,
  type Supplier,
  type Purchase,
  type PurchaseItem,
  type PurchaseStatus,
} from '@/db/schema/purchases'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

const PURCHASE_TRANSITIONS: Record<PurchaseStatus, PurchaseStatus[]> = {
  planning: ['submitted', 'cancelled'],
  submitted: ['received_jp', 'cancelled'],
  received_jp: ['completed'],
  completed: [],
  cancelled: [],
}

export function listValidPurchaseTransitions(from: PurchaseStatus): PurchaseStatus[] {
  return PURCHASE_TRANSITIONS[from]
}

export class InvalidPurchaseTransitionError extends Error {
  constructor(public from: PurchaseStatus, public to: PurchaseStatus) {
    super(`Invalid purchase status transition: ${from} -> ${to}`)
  }
}

export interface PurchaseListRow {
  purchase: Purchase
  supplier: Supplier | null
  itemCount: number
  totalQty: number
}

export async function listPurchases(): Promise<PurchaseListRow[]> {
  const rows = await db
    .select({
      purchase: purchases,
      supplier: suppliers,
      itemCount: sql<number>`(
        SELECT count(*)::int FROM ${purchaseItems}
        WHERE ${purchaseItems.purchaseId} = ${purchases.id}
      )`,
      totalQty: sql<number>`COALESCE((
        SELECT sum(${purchaseItems.quantity})::int FROM ${purchaseItems}
        WHERE ${purchaseItems.purchaseId} = ${purchases.id}
      ), 0)`,
    })
    .from(purchases)
    .leftJoin(suppliers, eq(suppliers.id, purchases.supplierId))
    .where(eq(purchases.orgId, DEFAULT_ORG_ID))
    .orderBy(desc(purchases.createdAt))

  return rows
}

export interface PurchaseDetail {
  purchase: Purchase
  supplier: Supplier | null
  items: PurchaseItem[]
}

export async function getPurchaseDetail(id: string): Promise<PurchaseDetail | null> {
  const row = await db
    .select({ purchase: purchases, supplier: suppliers })
    .from(purchases)
    .leftJoin(suppliers, eq(suppliers.id, purchases.supplierId))
    .where(and(eq(purchases.id, id), eq(purchases.orgId, DEFAULT_ORG_ID)))
    .limit(1)
  if (!row[0]) return null

  const items = await db
    .select()
    .from(purchaseItems)
    .where(eq(purchaseItems.purchaseId, id))
    .orderBy(asc(purchaseItems.createdAt))

  return { purchase: row[0].purchase, supplier: row[0].supplier, items }
}

export async function listSuppliers(): Promise<Supplier[]> {
  return db
    .select()
    .from(suppliers)
    .where(eq(suppliers.orgId, DEFAULT_ORG_ID))
    .orderBy(asc(suppliers.name))
}

export async function createSupplier(input: {
  name: string
  type: Supplier['type']
  contactInfo?: string | null
  notes?: string | null
}): Promise<Supplier> {
  const [row] = await db
    .insert(suppliers)
    .values({
      orgId: DEFAULT_ORG_ID,
      name: input.name,
      type: input.type,
      contactInfo: input.contactInfo ?? null,
      notes: input.notes ?? null,
    })
    .returning()
  return row
}

export async function createPurchase(input: {
  batchLabel: string
  supplierId?: string | null
  notes?: string | null
  createdById?: string | null
}): Promise<Purchase> {
  const [row] = await db
    .insert(purchases)
    .values({
      orgId: DEFAULT_ORG_ID,
      batchLabel: input.batchLabel,
      supplierId: input.supplierId ?? null,
      notes: input.notes ?? null,
      createdById: input.createdById ?? null,
    })
    .returning()
  return row
}

export async function updatePurchase(
  id: string,
  patch: Partial<Pick<Purchase, 'batchLabel' | 'supplierId' | 'notes' | 'actualJpyTotal'>>
): Promise<Purchase> {
  const [row] = await db
    .update(purchases)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(purchases.id, id), eq(purchases.orgId, DEFAULT_ORG_ID)))
    .returning()
  if (!row) throw new Error(`Purchase not found: ${id}`)
  return row
}

export async function changePurchaseStatus(
  id: string,
  to: PurchaseStatus
): Promise<Purchase> {
  const existing = await db
    .select()
    .from(purchases)
    .where(and(eq(purchases.id, id), eq(purchases.orgId, DEFAULT_ORG_ID)))
    .limit(1)
  if (!existing[0]) throw new Error(`Purchase not found: ${id}`)

  if (!PURCHASE_TRANSITIONS[existing[0].status].includes(to)) {
    throw new InvalidPurchaseTransitionError(existing[0].status, to)
  }

  const now = new Date()
  const stamps: Partial<Purchase> = { status: to, updatedAt: now }
  if (to === 'submitted') stamps.submittedAt = now
  if (to === 'received_jp') stamps.receivedAt = now
  if (to === 'completed') stamps.completedAt = now

  const [row] = await db
    .update(purchases)
    .set(stamps)
    .where(eq(purchases.id, id))
    .returning()
  return row
}

export async function addPurchaseItem(
  purchaseId: string,
  input: {
    productId?: string | null
    productNameSnapshot: string
    quantity: number
    unitJpy: number
    notes?: string | null
  }
): Promise<PurchaseItem> {
  const [row] = await db
    .insert(purchaseItems)
    .values({
      orgId: DEFAULT_ORG_ID,
      purchaseId,
      productId: input.productId ?? null,
      productNameSnapshot: input.productNameSnapshot,
      quantity: input.quantity,
      unitJpy: input.unitJpy,
      notes: input.notes ?? null,
    })
    .returning()

  await refreshExpectedTotal(purchaseId)
  return row
}

export async function updatePurchaseItem(
  itemId: string,
  patch: Partial<Pick<PurchaseItem, 'quantity' | 'unitJpy' | 'actualUnitJpy' | 'notes'>>
): Promise<PurchaseItem> {
  const [row] = await db
    .update(purchaseItems)
    .set(patch)
    .where(eq(purchaseItems.id, itemId))
    .returning()
  if (!row) throw new Error(`Purchase item not found: ${itemId}`)
  await refreshExpectedTotal(row.purchaseId)
  return row
}

export async function removePurchaseItem(itemId: string): Promise<void> {
  const existing = await db
    .select()
    .from(purchaseItems)
    .where(eq(purchaseItems.id, itemId))
    .limit(1)
  if (!existing[0]) return

  await db.delete(purchaseItems).where(eq(purchaseItems.id, itemId))
  await refreshExpectedTotal(existing[0].purchaseId)
}

async function refreshExpectedTotal(purchaseId: string): Promise<void> {
  const [agg] = await db
    .select({
      expected: sql<number>`COALESCE(sum(${purchaseItems.quantity} * ${purchaseItems.unitJpy})::int, 0)`,
      actual: sql<number>`COALESCE(sum(${purchaseItems.quantity} * COALESCE(${purchaseItems.actualUnitJpy}, ${purchaseItems.unitJpy}))::int, 0)`,
    })
    .from(purchaseItems)
    .where(eq(purchaseItems.purchaseId, purchaseId))

  await db
    .update(purchases)
    .set({
      expectedJpyTotal: agg?.expected ?? 0,
      actualJpyTotal: agg?.actual ?? null,
      updatedAt: new Date(),
    })
    .where(eq(purchases.id, purchaseId))
}
