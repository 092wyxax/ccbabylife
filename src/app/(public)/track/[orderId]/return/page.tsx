import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getOrderForTracking } from '@/server/services/OrderService'
import {
  canRequestReturn,
  listReturnsForOrder,
} from '@/server/services/ReturnService'
import { getCustomerSession } from '@/lib/customer-session'
import { ReturnRequestForm } from '@/components/account/ReturnRequestForm'
import { formatTwd } from '@/lib/format'

interface Props {
  params: Promise<{ orderId: string }>
}

export const metadata = { title: '申請退換貨' }

export default async function ReturnRequestPage({ params }: Props) {
  const { orderId } = await params
  const session = await getCustomerSession()
  if (!session) redirect(`/account?next=/track/${orderId}/return`)

  const detail = await getOrderForTracking(orderId)
  if (!detail) notFound()
  if (detail.order.customerId !== session.customerId) notFound()

  if (!canRequestReturn(detail.order)) {
    return (
      <div className="mx-auto max-w-xl px-4 sm:px-6 py-16 text-center">
        <h1 className="font-serif text-2xl mb-3">無法申請退換貨</h1>
        <p className="text-ink-soft text-sm mb-6">
          目前訂單狀態不接受退換貨申請。如有疑問請洽 LINE 客服。
        </p>
        <Link
          href={`/track/${orderId}`}
          className="font-jp text-sm bg-ink text-cream px-5 py-2.5 rounded-md hover:bg-accent tracking-wider"
        >
          返回訂單
        </Link>
      </div>
    )
  }

  const existing = await listReturnsForOrder(orderId)
  if (existing.length > 0) {
    return (
      <div className="mx-auto max-w-xl px-4 sm:px-6 py-16 text-center">
        <h1 className="font-serif text-2xl mb-3">已有申請紀錄</h1>
        <p className="text-ink-soft text-sm mb-6">
          這張訂單已經提交過退換貨申請：
          <span className="font-mono ml-1">{existing[0].requestNumber}</span>
        </p>
        <Link
          href={`/track/${orderId}`}
          className="font-jp text-sm bg-ink text-cream px-5 py-2.5 rounded-md hover:bg-accent tracking-wider"
        >
          返回訂單
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href={`/track/${orderId}`} className="hover:text-ink">
          ← 返回訂單 {detail.order.orderNumber}
        </Link>
      </nav>

      <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">
        RETURN · 申請退換貨
      </p>
      <h1 className="font-serif text-3xl mb-2">申請退換貨</h1>
      <p className="text-ink-soft text-sm mb-6 leading-relaxed">
        依消保法，鑑賞期 7 天內可申請退換。預購商品（日本下單後）可能不在鑑賞期內，
        請參考 <Link href="/terms" className="underline hover:text-accent">服務條款</Link>。
      </p>

      <ReturnRequestForm
        orderId={orderId}
        items={detail.items.map((i) => ({
          id: i.id,
          name: i.productNameSnapshot,
          quantity: i.quantity,
          lineTotal: formatTwd(i.lineTotal),
        }))}
      />
    </div>
  )
}
