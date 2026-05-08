import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { orders } from '@/db/schema'
import { formatTwd } from '@/lib/format'
import { STATUS_LABEL, statusBadgeClass } from '@/lib/order-progress'

interface Props {
  params: Promise<{ orderId: string }>
}

export const metadata = {
  title: '付款',
}

export default async function PaymentRelayPage({ params }: Props) {
  const { orderId } = await params

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)

  if (!order) notFound()

  // In sandbox mode we always show the form; in production check creds
  const ecpayConfigured =
    process.env.ECPAY_MODE !== 'production' ||
    Boolean(process.env.ECPAY_MERCHANT_ID && process.env.ECPAY_HASH_KEY && process.env.ECPAY_HASH_IV)

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-16">
      <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">
        PAYMENT · お支払い
      </p>
      <h1 className="font-serif text-3xl mb-2 tracking-wide">付款</h1>
      <p className="text-ink-soft text-sm mb-8 font-mono">{order.orderNumber}</p>

      <section className="bg-white border border-line rounded-lg p-6 mb-6 space-y-3">
        <Row label="ご注文番号 · 訂單編號" value={order.orderNumber} mono />
        <Row label="合計金額 · 訂單金額" value={formatTwd(order.total)} bold />
        <div className="flex justify-between items-baseline">
          <span className="font-jp text-ink-soft text-sm">現狀 · 目前狀態</span>
          <span className={`font-jp text-xs px-2 py-0.5 rounded-full tracking-wider ${statusBadgeClass(order.status)}`}>
            {STATUS_LABEL[order.status]}
          </span>
        </div>
      </section>

      {order.status !== 'pending_payment' ? (
        <section className="bg-success/10 border border-success/40 rounded-lg p-6 text-sm leading-relaxed">
          <p className="font-medium mb-2">此訂單不需付款</p>
          <p className="text-ink-soft">
            目前狀態為「{STATUS_LABEL[order.status]}」。
            如果這是錯誤，請私訊我們的 LINE 客服。
          </p>
          <Link
            href={`/track/${order.id}`}
            className="inline-block mt-4 font-jp bg-ink text-cream px-5 py-2.5 text-sm hover:bg-accent transition-colors tracking-wider"
          >
            ご注文を確認 · 看訂單追蹤
          </Link>
        </section>
      ) : ecpayConfigured ? (
        <section className="bg-cream-100 border border-line rounded-lg p-6">
          <p className="text-sm leading-relaxed mb-5">
            選擇付款方式，將跳轉至綠界完成付款。
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <PayMethodButton orderId={order.id} method="ALL" label="顯示全部" emoji="💳" />
            <PayMethodButton orderId={order.id} method="Credit" label="信用卡" emoji="💳" />
            <PayMethodButton orderId={order.id} method="ApplePay" label="Apple Pay" emoji="🍎" />
            <PayMethodButton orderId={order.id} method="TWQR" label="LINE Pay" emoji="💚" />
            <PayMethodButton orderId={order.id} method="ATM" label="ATM 轉帳" emoji="🏦" />
            <PayMethodButton orderId={order.id} method="CVS" label="超商代碼" emoji="🏪" />
          </div>
          <p className="text-xs text-ink-soft mt-4 leading-relaxed">
            付款連結每次點擊都會重新產生，無有效期問題。
            如果跳轉失敗，請重新點擊或聯繫 LINE 客服。
          </p>
        </section>
      ) : (
        <section className="bg-warning/10 border border-warning/40 rounded-lg p-6 text-sm leading-relaxed">
          <p className="font-medium mb-2">⚠ 金流系統審核中</p>
          <p className="text-ink-soft mb-3">
            綠界金流目前在審核中。審核通過後，本店會用 Email 寄付款連結給您。
            通過前請暫時保留此訂單，我們會在 7 天保留期內主動通知。
          </p>
          <p className="text-ink-soft">
            若有疑問，請私訊本店 LINE 官方帳號或回覆訂單建立時的 Email。
          </p>
        </section>
      )}

      <p className="mt-10 text-center text-xs text-ink-soft">
        <Link href={`/track/${order.id}`} className="hover:text-accent font-jp">
          ご注文の状況を確認 · 查看訂單進度
        </Link>
      </p>
    </div>
  )
}

function PayMethodButton({
  orderId,
  method,
  label,
  emoji,
}: {
  orderId: string
  method: string
  label: string
  emoji: string
}) {
  return (
    <form action={`/api/ecpay/create/${orderId}`} method="POST">
      <input type="hidden" name="method" value={method} />
      <button
        type="submit"
        className="w-full text-sm border border-line bg-white hover:border-ink hover:bg-cream-50 transition-colors px-3 py-2.5 rounded-md flex flex-col items-center gap-1"
      >
        <span className="text-lg">{emoji}</span>
        <span className="font-jp tracking-wider text-xs">{label}</span>
      </button>
    </form>
  )
}

function Row({
  label,
  value,
  mono,
  bold,
}: {
  label: string
  value: string
  mono?: boolean
  bold?: boolean
}) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="font-jp text-ink-soft text-sm">{label}</span>
      <span className={[mono && 'font-mono', bold && 'font-medium'].filter(Boolean).join(' ')}>
        {value}
      </span>
    </div>
  )
}
