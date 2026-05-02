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

export const metadata = {
  title: '我的訂單 | 日系選物店',
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

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <header className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">
            Account
          </p>
          <h1 className="font-serif text-3xl">我的訂單</h1>
          <p className="text-ink-soft text-sm mt-1">
            登入身份：{customer.name ?? customer.email}
          </p>
        </div>
        <form action={logoutAccountAction}>
          <button
            type="submit"
            className="text-xs text-ink-soft hover:text-danger underline"
          >
            登出
          </button>
        </form>
      </header>

      {myOrders.length === 0 ? (
        <div className="py-16 text-center text-ink-soft border border-dashed border-line rounded-lg">
          目前沒有訂單。<Link href="/shop" className="underline hover:text-accent ml-2">逛逛選物</Link>
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
        共 {myOrders.length} 筆訂單。需要協助請私訊 LINE 客服。
      </p>
    </div>
  )
}
