import Link from 'next/link'
import { listInvoicesPaged } from '@/server/services/InvoiceService'
import { formatTwd } from '@/lib/format'

export const dynamic = 'force-dynamic'

const STATUS_LABEL = {
  issued: '已開立',
  failed: '失敗',
  voided: '已作廢',
  allowance: '已折讓',
} as const

const STATUS_BADGE = {
  issued: 'bg-success/15 text-success',
  failed: 'bg-danger/15 text-danger',
  voided: 'bg-ink/10 text-ink-soft',
  allowance: 'bg-warning/15 text-warning',
} as const

export default async function InvoicesPage() {
  const rows = await listInvoicesPaged(200)

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl mb-1">電子發票</h1>
        <p className="text-ink-soft text-sm">
          訂單付款成功後自動開立。失敗的可在訂單頁手動重發。
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="bg-white border border-line border-dashed rounded-lg p-12 text-center text-ink-soft text-sm">
          尚未開立任何發票。等第一張訂單付款完成 → 自動開立。
        </div>
      ) : (
        <div className="bg-white border border-line rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-ink-soft">
              <tr>
                <th className="text-left px-4 py-3 font-normal">發票號碼</th>
                <th className="text-left px-4 py-3 font-normal">買受人</th>
                <th className="text-right px-4 py-3 font-normal">金額</th>
                <th className="text-left px-4 py-3 font-normal">狀態</th>
                <th className="text-left px-4 py-3 font-normal">開立時間</th>
                <th className="text-right px-4 py-3 font-normal">訂單</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => (
                <tr key={inv.id} className="border-t border-line">
                  <td className="px-4 py-3 font-mono text-xs">
                    {inv.invoiceNumber ?? '—'}
                    {inv.randomNumber && (
                      <span className="text-ink-soft ml-2">/{inv.randomNumber}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{inv.buyerName ?? '—'}</td>
                  <td className="px-4 py-3 text-right">{formatTwd(inv.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${STATUS_BADGE[inv.status]}`}>
                      {STATUS_LABEL[inv.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-soft">
                    {inv.issuedAt
                      ? new Date(inv.issuedAt).toLocaleString('zh-TW')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${inv.orderId}`}
                      className="text-xs underline hover:text-accent"
                    >
                      查看訂單
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-ink-soft mt-4 leading-relaxed">
        💡 環境：{process.env.ECPAY_MODE === 'production' ? '正式' : '沙盒（號碼為測試用）'}
      </p>
    </div>
  )
}
