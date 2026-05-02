import Link from 'next/link'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/db/client'
import { orders, orderItems, products, brands } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { STATUS_LABEL } from '@/lib/order-progress'
import { PrintButton } from '@/components/admin/PrintButton'

const PICK_STATUSES = ['arrived_tw', 'shipped'] as const

export const metadata = {
  title: '揀貨單 | 後台',
}

export default async function PickListPage() {
  // Aggregate items across all orders currently waiting to ship.
  const lineRows = await db
    .select({
      productId: orderItems.productId,
      productName: orderItems.productNameSnapshot,
      quantity: orderItems.quantity,
      orderNumber: orders.orderNumber,
      orderStatus: orders.status,
      brandName: brands.nameZh,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .leftJoin(products, eq(products.id, orderItems.productId))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(
      and(
        eq(orders.orgId, DEFAULT_ORG_ID),
        inArray(orders.status, [...PICK_STATUSES])
      )
    )

  // Group by productId (or product name if no id) — collect total qty + which orders
  const groups = new Map<
    string,
    {
      productId: string | null
      productName: string
      brandName: string | null
      totalQty: number
      orders: Array<{ orderNumber: string; quantity: number; status: string }>
    }
  >()

  for (const row of lineRows) {
    const key = row.productId ?? `name:${row.productName}`
    const existing = groups.get(key)
    if (existing) {
      existing.totalQty += row.quantity
      existing.orders.push({
        orderNumber: row.orderNumber,
        quantity: row.quantity,
        status: row.orderStatus,
      })
    } else {
      groups.set(key, {
        productId: row.productId,
        productName: row.productName,
        brandName: row.brandName,
        totalQty: row.quantity,
        orders: [
          {
            orderNumber: row.orderNumber,
            quantity: row.quantity,
            status: row.orderStatus,
          },
        ],
      })
    }
  }

  const rows = Array.from(groups.values()).sort((a, b) =>
    a.productName.localeCompare(b.productName, 'zh-Hant')
  )

  const totalOrders = new Set(lineRows.map((r) => r.orderNumber)).size
  const totalQty = lineRows.reduce((s, r) => s + r.quantity, 0)
  const today = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <div className="p-8 max-w-5xl print:p-4 print:max-w-none">
      <nav className="text-xs text-ink-soft mb-4 no-print">
        <Link href="/admin/inventory" className="hover:text-ink">
          庫存管理
        </Link>
        <span className="mx-2">/</span>
        <span>揀貨單</span>
      </nav>

      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl mb-1">揀貨單</h1>
          <p className="text-ink-soft text-sm">
            {today} · 共 {totalOrders} 筆待出貨訂單 · 商品總計 {totalQty} 件
          </p>
        </div>
        <PrintButton />
      </header>

      {rows.length === 0 ? (
        <div className="bg-white border border-line rounded-lg p-12 text-center text-ink-soft">
          目前沒有待出貨訂單。
        </div>
      ) : (
        <table className="w-full text-sm border-collapse border border-ink/30">
          <thead className="bg-cream-100">
            <tr>
              <th className="text-left p-2 border border-ink/30 w-10">#</th>
              <th className="text-left p-2 border border-ink/30">品名</th>
              <th className="text-right p-2 border border-ink/30 w-20">總計</th>
              <th className="text-left p-2 border border-ink/30 w-12">✓</th>
              <th className="text-left p-2 border border-ink/30">分配到訂單</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g, idx) => (
              <tr key={g.productId ?? g.productName} className="break-inside-avoid">
                <td className="p-2 border border-ink/30 text-ink-soft text-center">
                  {idx + 1}
                </td>
                <td className="p-2 border border-ink/30">
                  <p>{g.productName}</p>
                  {g.brandName && (
                    <p className="text-xs text-ink-soft">{g.brandName}</p>
                  )}
                </td>
                <td className="p-2 border border-ink/30 text-right text-base font-medium">
                  {g.totalQty}
                </td>
                <td className="p-2 border border-ink/30">
                  <span className="inline-block w-6 h-6 border border-ink/40 rounded" />
                </td>
                <td className="p-2 border border-ink/30 text-xs">
                  <ul className="space-y-0.5">
                    {g.orders.map((o, i) => (
                      <li key={`${o.orderNumber}-${i}`} className="font-mono">
                        {o.orderNumber} ×{o.quantity} ·{' '}
                        <span className="text-ink-soft">
                          {STATUS_LABEL[o.status as keyof typeof STATUS_LABEL] ?? o.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <footer className="mt-8 text-xs text-ink-soft no-print">
        <p>列印小提醒：Mac 用 Cmd+P、Win 用 Ctrl+P，列印時會自動隱藏側欄與導航。</p>
        <p className="mt-1">
          顯示狀態：「台灣到港」「已出貨」共 {totalOrders} 筆訂單。需調整請改 PICK_STATUSES 常數。
        </p>
      </footer>

      <style>{`
        @media print {
          aside, header.no-print, footer.no-print, .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }
        .break-inside-avoid {
          break-inside: avoid;
        }
      `}</style>
    </div>
  )
}
