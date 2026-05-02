import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getOrderForAdmin,
  listValidNextStatuses,
} from '@/server/services/OrderService'
import { OrderProgressBar } from '@/components/order/OrderProgressBar'
import { StatusChangeForm } from '@/components/order/StatusChangeForm'
import { STATUS_LABEL, statusBadgeClass } from '@/lib/order-progress'
import { formatTwd } from '@/lib/format'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params
  const detail = await getOrderForAdmin(id)
  if (!detail) notFound()

  const { order, customer, items, logs } = detail
  const validNext = listValidNextStatuses(order.status)

  return (
    <div className="p-8 max-w-5xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/orders" className="hover:text-ink">訂單管理</Link>
        <span className="mx-2">/</span>
        <span className="font-mono">{order.orderNumber}</span>
      </nav>

      <header className="flex items-start justify-between mb-6 pb-4 border-b border-line">
        <div>
          <h1 className="font-serif text-2xl font-mono mb-1">{order.orderNumber}</h1>
          <p className="text-ink-soft text-sm">
            建立於 {new Date(order.createdAt).toLocaleString('zh-TW')} ·{' '}
            <Link
              href={`/track/${order.id}`}
              target="_blank"
              className="underline hover:text-accent"
            >
              客戶端追蹤頁
            </Link>
          </p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full ${statusBadgeClass(order.status)}`}>
          {STATUS_LABEL[order.status]}
        </span>
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-8">
          <section>
            <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
              進度
            </h2>
            <OrderProgressBar status={order.status} />
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
              訂單項目
            </h2>
            <div className="bg-white border border-line rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-cream-100 text-ink-soft">
                  <tr>
                    <th className="text-left px-4 py-2 font-normal">品名</th>
                    <th className="text-right px-4 py-2 font-normal">單價</th>
                    <th className="text-right px-4 py-2 font-normal">數量</th>
                    <th className="text-right px-4 py-2 font-normal">小計</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-ink-soft text-xs">
                        尚未綁定訂單項目（Phase 1b 結帳建單時填入）
                      </td>
                    </tr>
                  ) : (
                    items.map((it) => (
                      <tr key={it.id} className="border-t border-line">
                        <td className="px-4 py-2">{it.productNameSnapshot}</td>
                        <td className="px-4 py-2 text-right">{formatTwd(it.priceTwdSnapshot)}</td>
                        <td className="px-4 py-2 text-right">{it.quantity}</td>
                        <td className="px-4 py-2 text-right font-medium">{formatTwd(it.lineTotal)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
              狀態歷史
            </h2>
            <div className="bg-white border border-line rounded-lg p-4">
              {logs.length === 0 ? (
                <p className="text-sm text-ink-soft">尚無變更紀錄。</p>
              ) : (
                <ol className="space-y-3 text-sm">
                  {logs.map((log) => (
                    <li key={log.id} className="flex items-start gap-3">
                      <span className="text-xs text-ink-soft mt-0.5 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('zh-TW')}
                      </span>
                      <div>
                        <p>
                          {log.fromStatus ? STATUS_LABEL[log.fromStatus] : '建立'}
                          {' → '}
                          <strong>{STATUS_LABEL[log.toStatus]}</strong>
                          {log.actorName && (
                            <span className="text-ink-soft text-xs ml-2">
                              by {log.actorName}
                            </span>
                          )}
                        </p>
                        {log.reason && (
                          <p className="text-xs text-ink-soft mt-0.5">{log.reason}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="bg-white border border-line rounded-lg p-5">
            <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
              變更狀態
            </h2>
            <StatusChangeForm
              orderId={order.id}
              currentStatus={order.status}
              validNext={validNext}
            />
          </section>

          <section className="bg-white border border-line rounded-lg p-5 text-sm space-y-2">
            <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-2">
              客戶
            </h2>
            <p>{customer?.name ?? customer?.email ?? '—'}</p>
            <p className="text-ink-soft text-xs">{customer?.email}</p>
            {customer?.phone && (
              <p className="text-ink-soft text-xs">{customer.phone}</p>
            )}
            {customer?.lineUserId && (
              <p className="text-ink-soft text-xs">LINE: {customer.lineUserId}</p>
            )}
          </section>

          <section className="bg-white border border-line rounded-lg p-5 text-sm space-y-2">
            <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-2">
              金額
            </h2>
            <Row label="商品小計" value={formatTwd(order.subtotal)} />
            <Row label="運費" value={formatTwd(order.shippingFee)} />
            <Row label="稅" value={formatTwd(order.tax)} />
            {order.storeCreditUsed > 0 && (
              <Row label="購物金折抵" value={`−${formatTwd(order.storeCreditUsed)}`} />
            )}
            <div className="pt-2 border-t border-line">
              <Row label="總計" value={formatTwd(order.total)} bold />
            </div>
            {order.ecpayTradeNo && (
              <p className="text-xs text-ink-soft pt-2 border-t border-line mt-3">
                綠界交易號：{order.ecpayTradeNo}
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className={bold ? 'font-medium' : ''}>{value}</span>
    </div>
  )
}
