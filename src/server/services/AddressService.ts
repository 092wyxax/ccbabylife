import 'server-only'
import { and, asc, eq, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { customerAddresses, type CustomerAddress } from '@/db/schema/customer_addresses'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

export async function listAddressesForCustomer(
  customerId: string
): Promise<CustomerAddress[]> {
  return db
    .select()
    .from(customerAddresses)
    .where(
      and(
        eq(customerAddresses.orgId, DEFAULT_ORG_ID),
        eq(customerAddresses.customerId, customerId)
      )
    )
    .orderBy(sql`${customerAddresses.isDefault} desc`, asc(customerAddresses.createdAt))
}

export async function getAddressForCustomer(
  customerId: string,
  addressId: string
): Promise<CustomerAddress | null> {
  const [row] = await db
    .select()
    .from(customerAddresses)
    .where(
      and(
        eq(customerAddresses.orgId, DEFAULT_ORG_ID),
        eq(customerAddresses.customerId, customerId),
        eq(customerAddresses.id, addressId)
      )
    )
    .limit(1)
  return row ?? null
}

interface AddressInput {
  label: string
  recipientName: string
  phone: string
  zipcode: string
  city: string
  street: string
  notes?: string | null
  isDefault: boolean
}

export async function createAddress(
  customerId: string,
  input: AddressInput
): Promise<CustomerAddress> {
  return db.transaction(async (tx) => {
    if (input.isDefault) {
      await tx
        .update(customerAddresses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(customerAddresses.customerId, customerId))
    }
    const [row] = await tx
      .insert(customerAddresses)
      .values({
        orgId: DEFAULT_ORG_ID,
        customerId,
        ...input,
        notes: input.notes ?? null,
      })
      .returning()
    return row
  })
}

export async function updateAddress(
  customerId: string,
  addressId: string,
  input: AddressInput
): Promise<CustomerAddress> {
  return db.transaction(async (tx) => {
    if (input.isDefault) {
      await tx
        .update(customerAddresses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(customerAddresses.customerId, customerId))
    }
    const [row] = await tx
      .update(customerAddresses)
      .set({ ...input, notes: input.notes ?? null, updatedAt: new Date() })
      .where(
        and(
          eq(customerAddresses.customerId, customerId),
          eq(customerAddresses.id, addressId)
        )
      )
      .returning()
    if (!row) throw new Error('Address not found')
    return row
  })
}

export async function deleteAddress(
  customerId: string,
  addressId: string
): Promise<void> {
  await db
    .delete(customerAddresses)
    .where(
      and(
        eq(customerAddresses.customerId, customerId),
        eq(customerAddresses.id, addressId)
      )
    )
}
