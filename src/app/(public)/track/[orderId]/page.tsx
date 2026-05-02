import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getOrderForTracking } from '@/server/services/OrderService'
import { OrderProgressBar } from '@/components/order/OrderProgressBar'
import { STATUS_LABEL, statusBadgeClass } from '@/lib/order-progress'
import { formatTwd } from '@/lib/format'

interface Props {
  params: Promise<{ orderId: string }>
}

export const metadata = {
  title: '訂單追蹤 | 日系選物店',
}

export default async function TrackPage({ params }: Props) {
  const { orderId } = await params
  const detail = await getOrderForTracking(orderId)
  if (!detail) notFound()

  const { order, items } = detail

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">
        Order Tracking
      </p>
      <h1 className="font-serif text-2xl mb-1 font-mono">{order.orderNumber}</h1>
      <p className="text-ink-soft text-sm mb-8">
        建立於 {new Date(order.createdAt).toLocaleString('zh-TW')}
        <span className={`ml-3 inline-block text-xs px-2 py-0.5 rounded-full ${statusBadgeClass(order.status)}`}>
          {STATUS_LABEL[order.status]}
        </span>
      </p>

      <section className="mb-8">
        <OrderProgressBar status={order.status} />
      </section>

      {order.expectedDelivery && (
        <section className="mb-8 bg-cream-100 border border-line rounded-lg p-5 text-sm">
          <p className="text-ink-soft mb-1">預計到貨</p>
          <p className="font-medium text-base">
            {new Date(order.expectedDelivery).toLocaleDateString('zh-TW', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </p>
          <p className="text-xs text-ink-soft mt-2">
            預購商品依當週批次集運。每階段我們會 LINE 推播通知妳。
          </p>
        </section>
      )}

      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
          訂購內容
        </h2>
        <div className="bg-white border border-line rounded-lg overflow-hidden">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-ink-soft text-sm">
              尚未綁定訂單項目（Phase 1b 結帳建單時填入）
            </p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t border-line first:border-t-0">
                    <td className="px-4 py-3">
                      <p>{it.productNameSnapshot}</p>
                      <p className="text-xs text-ink-soft">
                        {formatTwd(it.priceTwdSnapshot)} × {it.quantity}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatTwd(it.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-line space-y-1 text-sm">
          <Row label="商品小計" value={formatTwd(order.subtotal)} />
          <Row label="運費" value={formatTwd(order.shippingFee)} />
          {order.storeCreditUsed > 0 && (
            <Row label="購物金折抵" value={`−${formatTwd(order.storeCreditUsed)}`} />
          )}
          <Row label="總計" value={formatTwd(order.total)} bold />
        </div>
      </section>

      <section className="bg-cream-100 border border-line rounded-lg p-5 text-sm leading-relaxed">
        <p className="font-medium mb-2">需要協助？</p>
        <p className="text-ink-soft">
          有任何問題請直接私訊我們的 LINE 官方帳號，工作時間 24 小時內會回覆。
          或查看 <Link href="/faq" className="underline hover:text-accent">常見問題</Link>。
        </p>
      </section>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-soft">{label}</span>
      <span className={bold ? 'font-medium' : ''}>{value}</span>
    </div>
  )
}
