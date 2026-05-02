import 'server-only'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  customers,
  orders,
  type Customer,
  type Order,
} from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

export interface CustomerListRow {
  customer: Customer
  orderCount: number
  totalSpent: number
}

export async function listCustomers(): Promise<CustomerListRow[]> {
  const rows = await db
    .select({
      customer: customers,
      orderCount: sql<number>`(
        SELECT count(*)::int FROM ${orders}
        WHERE ${orders.customerId} = ${customers.id}
          AND ${orders.status} NOT IN ('cancelled')
      )`,
      totalSpent: sql<number>`COALESCE((
        SELECT sum(${orders.total})::int FROM ${orders}
        WHERE ${orders.customerId} = ${customers.id}
          AND ${orders.status} NOT IN ('cancelled', 'refunded', 'pending_payment')
      ), 0)`,
    })
    .from(customers)
    .where(eq(customers.orgId, DEFAULT_ORG_ID))
    .orderBy(desc(customers.createdAt))

  return rows
}

export interface CustomerDetail {
  customer: Customer
  orders: Order[]
  totalSpent: number
}

export async function getCustomerDetail(id: string): Promise<CustomerDetail | null> {
  const row = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.orgId, DEFAULT_ORG_ID)))
    .limit(1)
  if (!row[0]) return null

  const customer = row[0]

  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, id))
    .orderBy(desc(orders.createdAt))

  const totalSpent = orderRows
    .filter((o) => !['cancelled', 'refunded', 'pending_payment'].includes(o.status))
    .reduce((sum, o) => sum + o.total, 0)

  return { customer, orders: orderRows, totalSpent }
}

export function babyAgeMonths(birthDate: string | null): number | null {
  if (!birthDate) return null
  const born = new Date(birthDate)
  if (isNaN(born.getTime())) return null
  const now = new Date()
  return (
    (now.getFullYear() - born.getFullYear()) * 12 +
    (now.getMonth() - born.getMonth())
  )
}
