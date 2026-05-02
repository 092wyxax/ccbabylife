import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getOrderForAdmin } from '@/server/services/OrderService'
import { STATUS_LABEL } from '@/lib/order-progress'
import { formatTwd } from '@/lib/format'
import { PrintButton } from '@/components/admin/PrintButton'

export const metadata = {
  title: '出貨單 | 後台',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function InvoicePage({ params }: Props) {
  const { id } = await params
  const detail = await getOrderForAdmin(id)
  if (!detail) notFound()

  const { order, customer, items } = detail
  const addr = order.shippingAddress

  return (
    <div className="p-8 print:p-0 max-w-3xl mx-auto print:max-w-none invoice-root">
      <nav className="text-xs text-ink-soft mb-4 no-print">
        <Link href={`/admin/orders/${order.id}`} className="hover:text-ink">
          訂單 {order.orderNumber}
        </Link>
        <span className="mx-2">/</span>
        <span>出貨單</span>
      </nav>

      <div className="flex justify-end mb-6 no-print">
        <PrintButton />
      </div>

      <article className="bg-white border border-ink/30 p-8 print:border-0 print:p-2">
        <header className="flex items-start justify-between border-b border-ink/30 pb-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl mb-1">日系選物店</h1>
            <p className="text-xs text-ink-soft">統編 60766849 · 預購制日系母嬰／寵物選物</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-mono font-medium">{order.orderNumber}</p>
            <p className="text-xs text-ink-soft mt-1">
              {new Date(order.createdAt).toLocaleDateString('zh-TW')}
            </p>
            <p className="text-xs mt-1">{STATUS_LABEL[order.status]}</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-6 mb-6 text-sm">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-2">
              收件人
            </h2>
            {addr ? (
              <>
                <p>{addr.recipientName}</p>
                <p className="text-ink-soft text-xs mt-1">{addr.phone}</p>
                <p className="text-ink-soft text-xs">
                  {addr.zipcode} {addr.city}
                </p>
                <p className="text-ink-soft text-xs">{addr.address}</p>
              </>
            ) : (
              <p className="text-ink-soft text-xs">無寄件地址</p>
            )}
          </div>

          <div>
            <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-2">
              聯絡
            </h2>
            <p className="text-xs">{order.recipientEmail}</p>
            {order.recipientLineId && (
              <p className="text-xs text-ink-soft mt-1">
                LINE: {order.recipientLineId}
              </p>
            )}
            {customer && (
              <p className="text-xs text-ink-soft mt-2">
                客戶：{customer.name ?? customer.email}
              </p>
            )}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-2">
            訂購項目
          </h2>
          <table className="w-full text-sm border-collapse border border-ink/30">
            <thead className="bg-cream-100">
              <tr>
                <th className="text-left p-2 border border-ink/30">品名</th>
                <th className="text-right p-2 border border-ink/30 w-20">單價</th>
                <th className="text-right p-2 border border-ink/30 w-16">數量</th>
                <th className="text-right p-2 border border-ink/30 w-24">小計</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-2 border border-ink/30 text-center text-ink-soft text-xs">
                    無項目
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id}>
                    <td className="p-2 border border-ink/30">{it.productNameSnapshot}</td>
                    <td className="p-2 border border-ink/30 text-right">{formatTwd(it.priceTwdSnapshot)}</td>
                    <td className="p-2 border border-ink/30 text-right">{it.quantity}</td>
                    <td className="p-2 border border-ink/30 text-right">{formatTwd(it.lineTotal)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="p-2 border border-ink/30 text-right text-ink-soft text-xs">商品小計</td>
                <td className="p-2 border border-ink/30 text-right">{formatTwd(order.subtotal)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="p-2 border border-ink/30 text-right text-ink-soft text-xs">運費</td>
                <td className="p-2 border border-ink/30 text-right">{formatTwd(order.shippingFee)}</td>
              </tr>
              {order.storeCreditUsed > 0 && (
                <tr>
                  <td colSpan={3} className="p-2 border border-ink/30 text-right text-ink-soft text-xs">購物金折抵</td>
                  <td className="p-2 border border-ink/30 text-right">−{formatTwd(order.storeCreditUsed)}</td>
                </tr>
              )}
              <tr className="font-medium">
                <td colSpan={3} className="p-2 border border-ink/30 text-right">總計</td>
                <td className="p-2 border border-ink/30 text-right">{formatTwd(order.total)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        <footer className="mt-8 pt-4 border-t border-ink/30 text-xs text-ink-soft leading-relaxed">
          <p>感謝您的訂購。本商品為日本平行輸入個人選物。</p>
          <p>如有任何問題請私訊我們的 LINE 官方帳號。</p>
          {order.notes && (
            <p className="mt-2 italic">備註：{order.notes}</p>
          )}
        </footer>
      </article>

      <style>{`
        @media print {
          aside, header.no-print, .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          .invoice-root {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}
