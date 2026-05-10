import { desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { subscriptions, customers } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { adminRunSubscriptionNowAction } from '@/server/actions/subscriptions'

const FREQ_LABEL = {
  monthly: '每月',
  bimonthly: '每兩月',
  quarterly: '每季',
} as const

const STATUS_LABEL = {
  active: '進行中',
  paused: '暫停',
  cancelled: '已取消',
} as const

export default async function SubscriptionsAdminPage() {
  const rows = await db
    .select({
      sub: subscriptions,
      customer: customers,
    })
    .from(subscriptions)
    .leftJoin(customers, eq(customers.id, subscriptions.customerId))
    .where(eq(subscriptions.orgId, DEFAULT_ORG_ID))
    .orderBy(desc(subscriptions.createdAt))

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl mb-1">訂閱定期購</h1>
        <p className="text-ink-soft text-sm">
          客戶可訂閱固定週期的商品（紗布巾、寵物乾糧等）。
          <span className="text-sage">cron 每 10 分鐘檢查一次 nextRunAt</span>，到期時自動建立
          pending_payment 訂單並通知客戶付款。需要立即試跑可用「立即執行」按鈕。
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="bg-white border border-line rounded-lg p-12 text-center">
          <p className="text-ink-soft mb-2">目前沒有訂閱。</p>
          <p className="text-xs text-ink-soft">
            客戶端 UI 與 cron 自動建單尚未開放，可先用 SQL 建測試列。
          </p>
        </div>
      ) : (
        <div className="bg-white border border-line rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-ink-soft">
              <tr>
                <th className="text-left px-4 py-3 font-normal">客戶</th>
                <th className="text-left px-4 py-3 font-normal">頻率</th>
                <th className="text-left px-4 py-3 font-normal">下次出單</th>
                <th className="text-right px-4 py-3 font-normal">已執行次數</th>
                <th className="text-left px-4 py-3 font-normal">狀態</th>
                <th className="text-right px-4 py-3 font-normal">動作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ sub, customer }) => (
                <tr key={sub.id} className="border-t border-line">
                  <td className="px-4 py-3">{customer?.name ?? customer?.email ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-soft">{FREQ_LABEL[sub.frequency]}</td>
                  <td className="px-4 py-3 text-xs">
                    {new Date(sub.nextRunAt).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="px-4 py-3 text-right text-ink-soft">{sub.runCount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        'text-xs px-2 py-0.5 rounded-full ' +
                        (sub.status === 'active'
                          ? 'bg-success/15 text-ink'
                          : sub.status === 'paused'
                          ? 'bg-warning/20 text-ink'
                          : 'bg-ink/10 text-ink-soft')
                      }
                    >
                      {STATUS_LABEL[sub.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {sub.status === 'active' && (
                      <form action={adminRunSubscriptionNowAction}>
                        <input type="hidden" name="id" value={sub.id} />
                        <button
                          type="submit"
                          className="text-xs text-ink-soft hover:text-accent"
                          title="把 nextRunAt 設為現在並立即觸發 dispatcher"
                        >
                          立即執行
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="mt-8 bg-cream-100 border border-line rounded-lg p-6 text-sm leading-relaxed">
        <p className="font-medium mb-3">運作流程</p>
        <ol className="list-decimal list-inside text-ink-soft space-y-1">
          <li>客戶從商品頁建立訂閱（每月 / 每兩月 / 每季）</li>
          <li>系統依頻率設定 nextRunAt（30 / 60 / 90 天後）</li>
          <li>Cron <code className="text-xs bg-white px-1">/api/cron/dispatch-pushes</code>{' '}
            每 10 分鐘檢查一次到期訂閱</li>
          <li>到期 → 用當下商品價建立 pending_payment 訂單 + LINE/Email 通知客戶付款</li>
          <li>客戶端 /account/subscriptions 可暫停 / 還原 / 取消</li>
        </ol>
      </section>
    </div>
  )
}
