import { sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { products, orders, customers } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

export default async function AdminDashboardPage() {
  const [productStats, orderStats, customerStats] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where status = 'active')::int`,
      })
      .from(products)
      .where(sql`${products.orgId} = ${DEFAULT_ORG_ID}`),
    db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where status = 'pending_payment')::int`,
        toShip: sql<number>`count(*) filter (where status in ('paid','sourcing_jp','received_jp','shipping_intl','arrived_tw'))::int`,
      })
      .from(orders)
      .where(sql`${orders.orgId} = ${DEFAULT_ORG_ID}`),
    db
      .select({
        total: sql<number>`count(*)::int`,
      })
      .from(customers)
      .where(sql`${customers.orgId} = ${DEFAULT_ORG_ID}`),
  ])

  const stats = [
    { label: '商品總數', value: productStats[0].total, sub: `上架中 ${productStats[0].active}` },
    { label: '訂單總數', value: orderStats[0].total, sub: `待付款 ${orderStats[0].pending} · 待出貨 ${orderStats[0].toShip}` },
    { label: '客戶總數', value: customerStats[0].total, sub: ' ' },
  ]

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="font-serif text-2xl mb-1">儀表板</h1>
      <p className="text-ink-soft text-sm mb-8">日常營運一覽</p>

      <div className="grid sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white border border-line rounded-lg p-5"
          >
            <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">
              {s.label}
            </p>
            <p className="text-3xl font-medium">{s.value}</p>
            <p className="text-xs text-ink-soft mt-2">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-cream-100 border border-line rounded-lg text-sm leading-relaxed">
        <p className="font-medium mb-2">Phase 1a 進度</p>
        <ul className="space-y-1 text-ink-soft">
          <li>✓ Week 1 — 環境、Schema、認證</li>
          <li>✓ Week 2 — 前台、商品瀏覽、後台登入</li>
          <li>… 待開：商品 CRUD、訂單管理、結帳、LINE Login</li>
        </ul>
      </div>
    </div>
  )
}
