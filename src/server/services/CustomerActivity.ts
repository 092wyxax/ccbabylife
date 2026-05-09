import 'server-only'
import { and, desc, eq, isNotNull } from 'drizzle-orm'
import { db } from '@/db/client'
import { orders, customers, type Order } from '@/db/schema'
import { customerCoupons } from '@/db/schema/customer_coupons'
import { coupons } from '@/db/schema/coupons'
import { subscriptions } from '@/db/schema/subscriptions'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

export type ActivityKind = 'order' | 'coupon-used' | 'subscription' | 'signup'

export interface ActivityEvent {
  kind: ActivityKind
  at: Date
  title: string
  detail: string
  href?: string
}

export async function getCustomerActivity(
  customerId: string,
  limit = 12
): Promise<ActivityEvent[]> {
  const events: ActivityEvent[] = []

  // Customer signup
  const [c] = await db
    .select({
      createdAt: customers.createdAt,
      name: customers.name,
    })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1)
  if (c) {
    events.push({
      kind: 'signup',
      at: c.createdAt,
      title: '加入熙熙初日',
      detail: '歡迎來到我們的小店 🌸',
    })
  }

  // Recent orders (cap 12)
  const orderRows: Order[] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.orgId, DEFAULT_ORG_ID),
        eq(orders.customerId, customerId)
      )
    )
    .orderBy(desc(orders.createdAt))
    .limit(limit)

  for (const o of orderRows) {
    events.push({
      kind: 'order',
      at: o.createdAt,
      title: `訂單 ${o.orderNumber}`,
      detail: `NT$${o.total.toLocaleString()} · ${o.status}`,
      href: `/track/${o.id}`,
    })
  }

  // Coupons used
  const couponUsages = await db
    .select({
      usedAt: customerCoupons.usedAt,
      code: coupons.code,
    })
    .from(customerCoupons)
    .innerJoin(coupons, eq(coupons.id, customerCoupons.couponId))
    .where(
      and(
        eq(customerCoupons.orgId, DEFAULT_ORG_ID),
        eq(customerCoupons.customerId, customerId),
        isNotNull(customerCoupons.usedAt)
      )
    )
    .orderBy(desc(customerCoupons.usedAt))
    .limit(10)

  for (const u of couponUsages) {
    if (!u.usedAt) continue
    events.push({
      kind: 'coupon-used',
      at: u.usedAt,
      title: '使用優惠券',
      detail: u.code,
    })
  }

  // Subscriptions created
  const subs = await db
    .select({
      id: subscriptions.id,
      createdAt: subscriptions.createdAt,
      frequency: subscriptions.frequency,
    })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.orgId, DEFAULT_ORG_ID),
        eq(subscriptions.customerId, customerId)
      )
    )
    .orderBy(desc(subscriptions.createdAt))
    .limit(5)

  const FREQ_LABEL = {
    monthly: '每月',
    bimonthly: '每兩個月',
    quarterly: '每三個月',
  } as const

  for (const s of subs) {
    events.push({
      kind: 'subscription',
      at: s.createdAt,
      title: '建立訂閱',
      detail: `${FREQ_LABEL[s.frequency as keyof typeof FREQ_LABEL] ?? s.frequency} 配送`,
      href: '/account/subscriptions',
    })
  }

  events.sort((a, b) => b.at.getTime() - a.at.getTime())
  return events.slice(0, limit)
}
