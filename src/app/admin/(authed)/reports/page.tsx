import { sql, eq, desc } from 'drizzle-orm'
import { db } from '@/db/client'
import { orders, customers } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { formatTwd } from '@/lib/format'
import { requireRole } from '@/server/services/AdminAuthService'

export const dynamic = 'force-dynamic'

export default async function AdminReportsPage() {
  await requireRole(['owner', 'manager'])
  const thirtyDaysAgo = sql`(now() - interval '30 days')`
  const ninetyDaysAgo = sql`(now() - interval '90 days')`

  const [monthly, overall, topCustomers, repeatRate] = await Promise.all([
    db
      .select({
        month: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM')`,
        count: sql<number>`count(*)::int`,
        revenue: sql<number>`COALESCE(sum(${orders.total}) filter (where ${orders.status} not in ('cancelled', 'refunded', 'pending_payment')), 0)::int`,
      })
      .from(orders)
      .where(eq(orders.orgId, DEFAULT_ORG_ID))
      .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`)
      .orderBy(desc(sql`to_char(${orders.createdAt}, 'YYYY-MM')`))
      .limit(12),
    db
      .select({
        totalOrders: sql<number>`coalesce(count(*), 0)::int`,
        revenue: sql<number>`coalesce((sum(${orders.total}) filter (where ${orders.status} not in ('cancelled', 'refunded', 'pending_payment')))::int, 0)`,
        last30Revenue: sql<number>`coalesce((sum(${orders.total}) filter (where ${orders.status} not in ('cancelled', 'refunded', 'pending_payment') AND ${orders.createdAt} > ${thirtyDaysAgo}))::int, 0)`,
        avgOrderValue: sql<number>`coalesce(round(avg(${orders.total}) filter (where ${orders.status} not in ('cancelled', 'refunded', 'pending_payment')))::int, 0)`,
        cancelRate: sql<number>`coalesce(round(100.0 * count(*) filter (where ${orders.status} = 'cancelled') / nullif(count(*), 0))::int, 0)`,
      })
      .from(orders)
      .where(eq(orders.orgId, DEFAULT_ORG_ID)),
    db
      .select({
        customer: customers,
        orderCount: sql<number>`count(${orders.id})::int`,
        spent: sql<number>`COALESCE(sum(${orders.total}) filter (where ${orders.status} not in ('cancelled', 'refunded', 'pending_payment')), 0)::int`,
      })
      .from(customers)
      .leftJoin(orders, eq(orders.customerId, customers.id))
      .where(eq(customers.orgId, DEFAULT_ORG_ID))
      .groupBy(customers.id)
      .orderBy(desc(sql`sum(${orders.total}) filter (where ${orders.status} not in ('cancelled', 'refunded', 'pending_payment'))`))
      .limit(10),
    db
      .select({
        repeatBuyers: sql<number>`(
          SELECT count(*)::int FROM (
            SELECT ${orders.customerId} FROM ${orders}
            WHERE ${orders.orgId} = ${DEFAULT_ORG_ID}
              AND ${orders.status} not in ('cancelled', 'refunded', 'pending_payment')
              AND ${orders.createdAt} > ${ninetyDaysAgo}
            GROUP BY ${orders.customerId}
            HAVING count(*) > 1
          ) sub
        )`,
        totalBuyers: sql<number>`(
          SELECT count(distinct ${orders.customerId})::int FROM ${orders}
          WHERE ${orders.orgId} = ${DEFAULT_ORG_ID}
            AND ${orders.status} not in ('cancelled', 'refunded', 'pending_payment')
            AND ${orders.createdAt} > ${ninetyDaysAgo}
        )`,
      })
      .from(orders)
      .limit(1),
  ])

  const o = overall[0]
  const r = repeatRate[0]
  const repeatPct =
    r && r.totalBuyers > 0
      ? Math.round((100 * r.repeatBuyers) / r.totalBuyers)
      : 0

  const maxRevenue = Math.max(1, ...monthly.map((m) => m.revenue))

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl mb-1">報表</h1>
        <p className="text-ink-soft text-sm">
          營收 / 客戶 / 留存的基本統計（即時 query）
        </p>
      </header>

      <section className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        <Stat label="總訂單數" value={String(o.totalOrders)} />
        <Stat label="累積營收" value={formatTwd(o.revenue)} />
        <Stat label="近 30 天營收" value={formatTwd(o.last30Revenue)} />
        <Stat label="平均客單價" value={formatTwd(o.avgOrderValue)} />
        <Stat label="取消率" value={`${o.cancelRate}%`} />
      </section>

      <section className="bg-white border border-line rounded-lg p-6 mb-8">
        <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-4">
          每月訂單與營收（近 12 個月）
        </h2>
        {monthly.length === 0 ? (
          <p className="text-ink-soft text-sm py-6 text-center">尚無訂單資料</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {monthly.map((m) => (
              <li key={m.month} className="grid grid-cols-[80px_1fr_120px_60px] gap-3 items-center">
                <span className="text-xs text-ink-soft font-mono">{m.month}</span>
                <div className="bg-cream-100 rounded-md h-5 relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-accent/60"
                    style={{ width: `${(m.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
                <span className="text-right text-xs">{formatTwd(m.revenue)}</span>
                <span className="text-right text-xs text-ink-soft">{m.count} 筆</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-line rounded-lg p-5">
          <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
            Top 10 客戶（依 LTV）
          </h2>
          {topCustomers.length === 0 ? (
            <p className="text-sm text-ink-soft py-4 text-center">尚無資料</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {topCustomers.map(({ customer, orderCount, spent }) => (
                <li
                  key={customer.id}
                  className="flex items-center justify-between gap-4 py-1"
                >
                  <div className="min-w-0">
                    <p className="truncate">{customer.name ?? customer.email}</p>
                    <p className="text-xs text-ink-soft truncate">
                      {customer.email}
                    </p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <p className="font-medium">{formatTwd(spent)}</p>
                    <p className="text-xs text-ink-soft">{orderCount} 筆</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="bg-white border border-line rounded-lg p-5">
          <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
            留存率（過去 90 天）
          </h2>
          <p className="text-3xl font-medium mb-2">
            {repeatPct}%
          </p>
          <p className="text-sm text-ink-soft leading-relaxed">
            {r?.repeatBuyers ?? 0} 位重複下單客戶 / 總共 {r?.totalBuyers ?? 0} 位下過單
          </p>
          <p className="text-xs text-ink-soft mt-3 leading-relaxed">
            目標：母嬰產業健康的 90 天回購率落在 30–40%。低於 20% 表示產品 / 心得內容沒有黏性。
          </p>
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-line rounded-lg p-4">
      <p className="text-xs uppercase tracking-widest text-ink-soft mb-1">
        {label}
      </p>
      <p className="text-xl font-medium">{value}</p>
    </div>
  )
}
