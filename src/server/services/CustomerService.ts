import 'server-only'
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  customers,
  orders,
  type Customer,
  type Order,
} from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { paged, type Paged, type PageParams } from '@/lib/pagination'

export interface CustomerListRow {
  customer: Customer
  orderCount: number
  totalSpent: number
}

export async function listCustomers(
  opts: { search?: string; page: PageParams }
): Promise<Paged<CustomerListRow>> {
  const conds = [eq(customers.orgId, DEFAULT_ORG_ID)]
  if (opts.search) {
    const q = `%${opts.search}%`
    conds.push(
      or(
        ilike(customers.name, q),
        ilike(customers.email, q),
        ilike(customers.phone, q)
      )!
    )
  }

  const where = and(...conds)

  const [rows, totalRow] = await Promise.all([
    db
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
      .where(where)
      .orderBy(desc(customers.createdAt))
      .limit(opts.page.pageSize)
      .offset(opts.page.offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(where),
  ])

  return paged(rows, totalRow[0]?.count ?? 0, opts.page)
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
