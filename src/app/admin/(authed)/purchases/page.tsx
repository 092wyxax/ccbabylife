import Link from 'next/link'
import { listPurchases } from '@/server/services/PurchaseService'
import { PURCHASE_STATUS_LABEL, purchaseStatusBadge } from '@/lib/purchase-status'
import { formatJpy } from '@/lib/format'

export default async function AdminPurchasesPage() {
  const rows = await listPurchases()

  return (
    <div className="p-8 max-w-7xl">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl mb-1">採購管理</h1>
          <p className="text-ink-soft text-sm">
            共 {rows.length} 筆採購單 ·{' '}
            <Link href="/admin/purchases/suppliers" className="underline hover:text-accent">
              供應商管理
            </Link>
          </p>
        </div>
        <Link
          href="/admin/purchases/new"
          className="bg-ink text-cream px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors"
        >
          + 建立採購單
        </Link>
      </header>

      <div className="bg-white border border-line rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream-100 text-ink-soft">
            <tr>
              <th className="text-left px-4 py-3 font-normal">批次</th>
              <th className="text-left px-4 py-3 font-normal">供應商</th>
              <th className="text-left px-4 py-3 font-normal">狀態</th>
              <th className="text-right px-4 py-3 font-normal">商品筆數</th>
              <th className="text-right px-4 py-3 font-normal">總件數</th>
              <th className="text-right px-4 py-3 font-normal">預估日幣</th>
              <th className="text-left px-4 py-3 font-normal">建立日期</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-ink-soft">
                  還沒有採購單。點右上「+ 建立採購單」開始。
                </td>
              </tr>
            ) : (
              rows.map(({ purchase, supplier, itemCount, totalQty }) => (
                <tr key={purchase.id} className="border-t border-line hover:bg-cream-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/purchases/${purchase.id}`}
                      className="hover:text-accent font-medium"
                    >
                      {purchase.batchLabel}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{supplier?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${purchaseStatusBadge(purchase.status)}`}>
                      {PURCHASE_STATUS_LABEL[purchase.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-ink-soft">{itemCount}</td>
                  <td className="px-4 py-3 text-right text-ink-soft">{totalQty}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatJpy(purchase.expectedJpyTotal)}
                  </td>
                  <td className="px-4 py-3 text-ink-soft text-xs">
                    {new Date(purchase.createdAt).toLocaleDateString('zh-TW')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
