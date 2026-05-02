import Link from 'next/link'
import { sql, and, eq, inArray, gte, desc } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  products,
  orders,
  customers,
  purchases,
  type Order,
  type Customer,
  brands,
} from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { STATUS_LABEL, statusBadgeClass } from '@/lib/order-progress'
import {
  PURCHASE_STATUS_LABEL,
  purchaseStatusBadge,
} from '@/lib/purchase-status'
import { formatTwd, formatJpy } from '@/lib/format'

const PENDING_SHIP_STATUSES = [
  'paid',
  'sourcing_jp',
  'received_jp',
  'shipping_intl',
  'arrived_tw',
] as const
const ACTIVE_PURCHASE_STATUSES = ['planning', 'submitted', 'received_jp'] as const
const LOW_STOCK_THRESHOLD = 3

export default async function AdminDashboardPage() {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(now.getDate() - now.getDay()) // Sunday-start; adjust to ISO week if needed

  const orgWhere = eq(orders.orgId, DEFAULT_ORG_ID)

  const [
    productAgg,
    orderAgg,
    customerAgg,
    weekOrderAgg,
    pendingShipRows,
    activePurchaseRows,
    lowStockRows,
    recentOrders,
  ] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where status = 'active')::int`,
        draft: sql<number>`count(*) filter (where status = 'draft')::int`,
      })
      .from(products)
      .where(eq(products.orgId, DEFAULT_ORG_ID)),
    db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where status = 'pending_payment')::int`,
        completed: sql<number>`count(*) filter (where status = 'completed')::int`,
        revenue: sql<number>`COALESCE(sum(total) filter (where status not in ('cancelled', 'refunded', 'pending_payment')), 0)::int`,
      })
      .from(orders)
      .where(orgWhere),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(customers)
      .where(eq(customers.orgId, DEFAULT_ORG_ID)),
    db
      .select({
        count: sql<number>`count(*)::int`,
        revenue: sql<number>`COALESCE(sum(total) filter (where status not in ('cancelled', 'refunded', 'pending_payment')), 0)::int`,
      })
      .from(orders)
      .where(and(orgWhere, gte(orders.createdAt, weekStart))),
    db
      .select({ order: orders, customer: customers })
      .from(orders)
      .leftJoin(customers, eq(customers.id, orders.customerId))
      .where(and(orgWhere, inArray(orders.status, [...PENDING_SHIP_STATUSES])))
      .orderBy(desc(orders.createdAt))
      .limit(8),
    db
      .select()
      .from(purchases)
      .where(
        and(
          eq(purchases.orgId, DEFAULT_ORG_ID),
          inArray(purchases.status, [...ACTIVE_PURCHASE_STATUSES])
        )
      )
      .orderBy(desc(purchases.createdAt))
      .limit(8),
    db
      .select({ product: products, brand: brands })
      .from(products)
      .leftJoin(brands, eq(brands.id, products.brandId))
      .where(
        and(
          eq(products.orgId, DEFAULT_ORG_ID),
          eq(products.stockType, 'in_stock'),
          sql`${products.stockQuantity} <= ${LOW_STOCK_THRESHOLD}`
        )
      )
      .limit(8),
    db
      .select({ order: orders, customer: customers })
      .from(orders)
      .leftJoin(customers, eq(customers.id, orders.customerId))
      .where(orgWhere)
      .orderBy(desc(orders.createdAt))
      .limit(5),
  ])

  const stats = [
    {
      label: '本週新訂單',
      value: weekOrderAgg[0].count,
      sub: `營業額 ${formatTwd(weekOrderAgg[0].revenue)}`,
      href: '/admin/orders',
    },
    {
      label: '待出貨訂單',
      value: pendingShipRows.length,
      sub: '已付款 → 已出貨之間',
      href: '/admin/orders?status=paid',
    },
    {
      label: '進行中採購單',
      value: activePurchaseRows.length,
      sub: '規劃 / 已下單 / 日本到貨',
      href: '/admin/purchases',
    },
    {
      label: '低庫存商品',
      value: lowStockRows.length,
      sub: `≤ ${LOW_STOCK_THRESHOLD} 件`,
      href: '/admin/inventory',
    },
  ]

  const totals = [
    {
      label: '商品總數',
      value: productAgg[0].total,
      sub: `上架中 ${productAgg[0].active} · 草稿 ${productAgg[0].draft}`,
    },
    {
      label: '訂單總數',
      value: orderAgg[0].total,
      sub: `已完成 ${orderAgg[0].completed} · 累積營收 ${formatTwd(orderAgg[0].revenue)}`,
    },
    {
      label: '客戶總數',
      value: customerAgg[0].total,
      sub: ' ',
    },
  ]

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="font-serif text-2xl mb-1">儀表板</h1>
      <p className="text-ink-soft text-sm mb-8">
        本週起算自週日 {weekStart.toLocaleDateString('zh-TW')}
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white border border-line rounded-lg p-5 hover:border-ink transition-colors"
          >
            <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">
              {s.label}
            </p>
            <p className="text-3xl font-medium">{s.value}</p>
            <p className="text-xs text-ink-soft mt-2">{s.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <DashboardCard
          title="待出貨訂單"
          count={pendingShipRows.length}
          empty="目前沒有待出貨訂單"
          link={{ href: '/admin/orders', label: '所有訂單 →' }}
        >
          <ul className="text-sm divide-y divide-line">
            {pendingShipRows.map(({ order, customer }) => (
              <PendingOrderRow key={order.id} order={order} customer={customer} />
            ))}
          </ul>
        </DashboardCard>

        <DashboardCard
          title="進行中採購單"
          count={activePurchaseRows.length}
          empty="目前沒有進行中採購單"
          link={{ href: '/admin/purchases', label: '所有採購 →' }}
        >
          <ul className="text-sm divide-y divide-line">
            {activePurchaseRows.map((p) => (
                <li key={p.id} className="py-2 flex items-center justify-between">
                  <Link href={`/admin/purchases/${p.id}`} className="hover:text-accent">
                    {p.batchLabel}
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink-soft">
                      {formatJpy(p.expectedJpyTotal)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${purchaseStatusBadge(p.status)}`}>
                      {PURCHASE_STATUS_LABEL[p.status]}
                    </span>
                  </div>
                </li>
              ))}
          </ul>
        </DashboardCard>

        <DashboardCard
          title="低庫存警告"
          count={lowStockRows.length}
          empty="所有現貨商品庫存正常"
          link={{ href: '/admin/inventory', label: '庫存管理 →' }}
        >
          <ul className="text-sm divide-y divide-line">
            {lowStockRows.map(({ product, brand }) => (
                <li key={product.id} className="py-2 flex items-center justify-between">
                  <div>
                    <Link href={`/admin/products/${product.id}`} className="hover:text-accent">
                      {product.nameZh}
                    </Link>
                    {brand && <span className="text-xs text-ink-soft ml-2">{brand.nameZh}</span>}
                  </div>
                  <span
                    className={
                      'text-xs px-2 py-0.5 rounded-full ' +
                      (product.stockQuantity <= 0
                        ? 'bg-danger/15 text-danger'
                        : 'bg-warning/20 text-ink')
                    }
                  >
                    剩 {product.stockQuantity} 件
                  </span>
                </li>
              ))}
          </ul>
        </DashboardCard>

        <DashboardCard
          title="近 5 筆訂單"
          count={recentOrders.length}
          empty="尚無訂單"
          link={{ href: '/admin/orders', label: '所有訂單 →' }}
        >
          <ul className="text-sm divide-y divide-line">
            {recentOrders.map(({ order, customer }) => (
                <li key={order.id} className="py-2 flex items-center justify-between">
                  <div>
                    <Link href={`/admin/orders/${order.id}`} className="hover:text-accent font-mono text-xs">
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-ink-soft mt-0.5">
                      {customer?.name ?? customer?.email ?? '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{formatTwd(order.total)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadgeClass(order.status)}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                  </div>
                </li>
              ))}
          </ul>
        </DashboardCard>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {totals.map((t) => (
          <div
            key={t.label}
            className="bg-cream-100 border border-line rounded-lg p-4 text-center"
          >
            <p className="text-xs text-ink-soft mb-1">{t.label}</p>
            <p className="text-2xl font-medium">{t.value}</p>
            <p className="text-xs text-ink-soft mt-1">{t.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardCard({
  title,
  count,
  children,
  empty,
  link,
}: {
  title: string
  count: number
  children: React.ReactNode
  empty: string
  link: { href: string; label: string }
}) {
  return (
    <section className="bg-white border border-line rounded-lg p-5">
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-xs uppercase tracking-widest text-ink-soft">
          {title}
        </h2>
        <Link href={link.href} className="text-xs text-ink-soft hover:text-accent">
          {link.label}
        </Link>
      </header>
      {count === 0 ? (
        <p className="text-sm text-ink-soft py-4 text-center">{empty}</p>
      ) : (
        children
      )}
    </section>
  )
}

function PendingOrderRow({
  order,
  customer,
}: {
  order: Order
  customer: Customer | null
}) {
  return (
    <li className="py-2 flex items-center justify-between">
      <div>
        <Link href={`/admin/orders/${order.id}`} className="hover:text-accent font-mono text-xs">
          {order.orderNumber}
        </Link>
        <p className="text-xs text-ink-soft mt-0.5">
          {customer?.name ?? customer?.email ?? '—'}
        </p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadgeClass(order.status)}`}>
        {STATUS_LABEL[order.status]}
      </span>
    </li>
  )
}

