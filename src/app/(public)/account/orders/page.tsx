import Link from 'next/link'
import { redirect } from 'next/navigation'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { orders, customers } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { getCustomerSession } from '@/lib/customer-session'
import { logoutAccountAction } from '@/server/actions/account'
import { STATUS_LABEL, statusBadgeClass } from '@/lib/order-progress'
import { formatTwd } from '@/lib/format'
import { EmptyOrdersIllustration } from '@/components/shared/BrandIllustrations'
import { ensureReferralCode } from '@/server/services/ReferralService'

export const metadata = {
  title: '我的訂單',
}

export default async function MyOrdersPage() {
  const session = await getCustomerSession()
  if (!session) redirect('/account')

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, session.customerId))
    .limit(1)

  if (!customer) redirect('/account')

  const myOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, session.customerId))
    .orderBy(desc(orders.createdAt))

  const referralCode = await ensureReferralCode(customer.id)
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const referralUrl = `${siteUrl}/api/referral/${referralCode}`

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/account" className="hover:text-ink">會員中心</Link>
        <span className="mx-2">/</span>
        <span>我的訂單</span>
      </nav>
      <header className="flex items-start justify-between mb-8">
        <div>
          <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">
            ORDERS · ご注文一覧
          </p>
          <h1 className="font-serif text-3xl tracking-wide">我的訂單</h1>
          <p className="text-ink-soft text-sm mt-1">
            {customer.name ?? customer.email}
          </p>
        </div>
        <form action={logoutAccountAction}>
          <button
            type="submit"
            className="font-jp text-xs text-ink-soft hover:text-danger underline tracking-wider"
          >
            ログアウト · 登出
          </button>
        </form>
      </header>

      {myOrders.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-sage flex justify-center mb-5">
            <EmptyOrdersIllustration className="w-44 h-32" />
          </div>
          <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">
            NO ORDERS YET
          </p>
          <h2 className="font-serif text-xl mb-3 tracking-wide">目前沒有訂單</h2>
          <p className="text-ink-soft text-sm mb-6">
            下第一張訂單後，會出現在這裡
          </p>
          <Link
            href="/shop"
            className="font-jp inline-block bg-ink text-cream px-6 py-3 rounded-md hover:bg-accent transition-colors tracking-[0.15em] text-sm"
          >
            去逛逛選物
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {myOrders.map((o) => (
            <li
              key={o.id}
              className="bg-white border border-line rounded-lg p-5 flex items-center justify-between"
            >
              <div>
                <Link
                  href={`/track/${o.id}`}
                  className="font-mono text-sm hover:text-accent"
                >
                  {o.orderNumber}
                </Link>
                <p className="text-xs text-ink-soft mt-1">
                  {new Date(o.createdAt).toLocaleString('zh-TW')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatTwd(o.total)}</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${statusBadgeClass(o.status)}`}
                >
                  {STATUS_LABEL[o.status]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-xs text-ink-soft">
        <span className="font-jp">全 {myOrders.length} 件</span>。需要協助請私訊 LINE 客服。
      </p>

      <section className="mt-12 p-5 bg-cream-100 border border-line rounded-lg text-sm">
        <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-1">REFERRAL · ご紹介</p>
        <h2 className="font-serif text-lg mb-2 tracking-wide">推薦朋友</h2>
        <p className="text-ink-soft text-xs leading-relaxed mb-3">
          把這條連結傳給朋友，朋友首單成立後妳會獲得購物金（金額之後公告）。
        </p>
        <div className="bg-white border border-line rounded-md p-3 text-xs font-mono break-all select-all">
          {referralUrl}
        </div>
        <p className="text-xs text-ink-soft mt-2">
          推薦碼：<span className="font-mono">{referralCode}</span>
        </p>
      </section>
    </div>
  )
}
