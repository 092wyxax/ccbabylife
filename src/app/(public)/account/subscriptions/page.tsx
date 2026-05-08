import Link from 'next/link'
import { redirect } from 'next/navigation'
import { eq, inArray } from 'drizzle-orm'
import { db } from '@/db/client'
import { products, type Product } from '@/db/schema'
import { getCustomerSession } from '@/lib/customer-session'
import { listSubscriptionsForCustomer } from '@/server/services/SubscriptionService'
import {
  pauseSubscriptionAction,
  resumeSubscriptionAction,
  cancelSubscriptionAction,
} from '@/server/actions/subscriptions'
import { formatTwd } from '@/lib/format'

export const metadata = { title: '我的訂閱' }
export const dynamic = 'force-dynamic'

const FREQ_LABEL = { monthly: '每月', bimonthly: '每兩個月', quarterly: '每三個月' }
const STATUS_LABEL = {
  active: { label: '進行中', cls: 'bg-success/15 text-success' },
  paused: { label: '已暫停', cls: 'bg-warning/15 text-warning' },
  cancelled: { label: '已取消', cls: 'bg-ink/10 text-ink-soft' },
}

export default async function SubscriptionsPage() {
  const session = await getCustomerSession()
  if (!session) redirect('/account')

  const subs = await listSubscriptionsForCustomer(session.customerId)

  // Resolve product names
  const allIds = Array.from(
    new Set(subs.flatMap((s) => s.lines.map((l) => l.productId)))
  )
  const productRows: Product[] = allIds.length
    ? await db.select().from(products).where(inArray(products.id, allIds))
    : []
  const byId = new Map(productRows.map((p) => [p.id, p]))

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">
        SUBSCRIPTIONS · 定期便
      </p>
      <h1 className="font-serif text-3xl mb-2 tracking-wide">我的訂閱</h1>
      <p className="text-ink-soft text-sm mb-8">
        每月 / 每兩個月 / 每季自動下單耗品。可隨時暫停或取消。
      </p>

      {subs.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-line rounded-lg">
          <p className="text-ink-soft mb-4">還沒有訂閱任何商品</p>
          <Link href="/shop" className="text-accent hover:underline text-sm">
            去逛逛 →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {subs.map((s) => {
            const status = STATUS_LABEL[s.status]
            return (
              <article
                key={s.id}
                className="bg-white border border-line rounded-lg p-5"
              >
                <header className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-jp text-[11px] tracking-[0.25em] text-ink-soft mb-1">
                      {FREQ_LABEL[s.frequency as keyof typeof FREQ_LABEL]} · {s.runCount} 次配送
                    </p>
                    <p className="text-xs text-ink-soft">
                      下次配送：
                      <span className="ml-1 text-ink">
                        {new Date(s.nextRunAt).toLocaleDateString('zh-TW')}
                      </span>
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${status.cls}`}>
                    {status.label}
                  </span>
                </header>

                <ul className="text-sm space-y-1 mb-4">
                  {s.lines.map((l) => {
                    const p = byId.get(l.productId)
                    return (
                      <li key={l.productId} className="flex justify-between">
                        <span>{p?.nameZh ?? '— (商品已下架)'} × {l.quantity}</span>
                        <span className="text-ink-soft">
                          {p ? formatTwd(p.priceTwd * l.quantity) : '—'}
                        </span>
                      </li>
                    )
                  })}
                </ul>

                <div className="flex gap-2 pt-3 border-t border-line">
                  {s.status === 'active' && (
                    <form action={pauseSubscriptionAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <button
                        type="submit"
                        className="text-xs border border-line px-3 py-1.5 rounded-md hover:border-ink"
                      >
                        暫停
                      </button>
                    </form>
                  )}
                  {s.status === 'paused' && (
                    <form action={resumeSubscriptionAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <button
                        type="submit"
                        className="text-xs bg-ink text-cream px-3 py-1.5 rounded-md hover:bg-accent"
                      >
                        恢復
                      </button>
                    </form>
                  )}
                  {s.status !== 'cancelled' && (
                    <form action={cancelSubscriptionAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <button
                        type="submit"
                        className="text-xs text-danger hover:underline"
                      >
                        取消訂閱
                      </button>
                    </form>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
