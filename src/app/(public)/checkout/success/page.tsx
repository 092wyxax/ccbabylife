import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ClearCart } from './ClearCart'
import { getOrderForTracking } from '@/server/services/OrderService'
import { formatTwd } from '@/lib/format'
import { OrderSuccessIllustration } from '@/components/shared/BrandIllustrations'

interface Props {
  searchParams: Promise<{ orderId?: string }>
}

export const metadata = {
  title: '訂單已送出',
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { orderId } = await searchParams
  if (!orderId) notFound()

  const detail = await getOrderForTracking(orderId)
  if (!detail) notFound()

  const { order } = detail

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
      <ClearCart />

      <div className="text-center mb-12">
        <div className="text-seal mb-4 flex justify-center">
          <OrderSuccessIllustration className="w-48 h-40" />
        </div>
        <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">
          ありがとうございました
        </p>
        <h1 className="font-serif text-3xl mb-3 tracking-wide">訂單已送出 · 謝謝你</h1>
        <p className="text-ink-soft text-sm leading-relaxed max-w-md mx-auto">
          我們已經收到你的訂單。<br />
          請保留以下資訊查詢進度，
          <br className="sm:hidden" />
          並留意 LINE / Email 通知。
        </p>
      </div>

      <div className="bg-white border border-line rounded-lg p-6 space-y-3 mb-8">
        <div className="flex justify-between">
          <span className="font-jp text-ink-soft text-sm">お注文番号 · 訂單編號</span>
          <span className="font-mono">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-jp text-ink-soft text-sm">合計金額 · 訂單金額</span>
          <span className="font-medium">{formatTwd(order.total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-jp text-ink-soft text-sm">メール · 收件 Email</span>
          <span className="text-sm">{order.recipientEmail}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-jp text-ink-soft text-sm">現狀 · 目前狀態</span>
          <span className="font-jp text-xs bg-warning/20 px-2 py-0.5 rounded-full tracking-wider">
            お支払待ち · 待付款
          </span>
        </div>
      </div>

      <div className="bg-cream-100 border border-line rounded-lg p-5 text-sm leading-relaxed mb-8">
        <p className="font-medium mb-2">付款方式（重要）</p>
        <p className="text-ink-soft">
          綠界金流目前在審核中。審核通過後，我們會用 Email 寄付款連結給妳。
          收到後付款，訂單即進入日本下單流程。若超過 7 天未付款，訂單會自動取消。
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={`/track/${order.id}`}
          className="flex-1 text-center bg-ink text-cream py-3 rounded-md hover:bg-accent transition-colors"
        >
          查看訂單追蹤頁
        </Link>
        <Link
          href="/shop"
          className="flex-1 text-center border border-line py-3 rounded-md hover:border-ink transition-colors"
        >
          繼續逛逛選物
        </Link>
      </div>
    </div>
  )
}
