import { desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { db } from '@/db/client'
import { orders, customers } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { formatTwd } from '@/lib/format'

const STATUS_LABELS: Record<string, string> = {
  pending_payment: '待付款',
  paid: '已付款',
  sourcing_jp: '日本下單中',
  received_jp: '日本到貨',
  shipping_intl: '國際集運',
  arrived_tw: '台灣到港',
  shipped: '已出貨',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款',
}

export default async function AdminOrdersPage() {
  const rows = await db
    .select({ order: orders, customer: customers })
    .from(orders)
    .leftJoin(customers, eq(customers.id, orders.customerId))
    .where(eq(orders.orgId, DEFAULT_ORG_ID))
    .orderBy(desc(orders.createdAt))
    .limit(100)

  return (
    <div className="p-8 max-w-7xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl mb-1">訂單管理</h1>
        <p className="text-ink-soft text-sm">共 {rows.length} 筆</p>
      </header>

      {rows.length === 0 ? (
        <div className="bg-white border border-line rounded-lg p-12 text-center">
          <p className="text-ink-soft mb-2">目前沒有訂單。</p>
          <p className="text-xs text-ink-soft">
            Phase 1b 開放結帳後，客戶下單會出現在這。前台先逛 →{' '}
            <Link href="/shop" target="_blank" className="underline hover:text-accent">
              /shop
            </Link>
          </p>
        </div>
      ) : (
        <div className="bg-white border border-line rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-ink-soft">
              <tr>
                <th className="text-left px-4 py-3 font-normal">訂單編號</th>
                <th className="text-left px-4 py-3 font-normal">客戶</th>
                <th className="text-left px-4 py-3 font-normal">狀態</th>
                <th className="text-right px-4 py-3 font-normal">金額</th>
                <th className="text-left px-4 py-3 font-normal">建立日期</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ order, customer }) => (
                <tr key={order.id} className="border-t border-line hover:bg-cream-50">
                  <td className="px-4 py-3 font-mono text-xs">{order.orderNumber}</td>
                  <td className="px-4 py-3">{customer?.name ?? customer?.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-line px-2 py-0.5 rounded-full">
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatTwd(order.total)}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {new Date(order.createdAt).toLocaleDateString('zh-TW')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
