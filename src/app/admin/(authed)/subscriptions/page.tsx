import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { subscriptions, customers } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

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
          客戶可訂閱固定週期的商品（紗布巾、寵物乾糧等）。Cron 在每張訂閱的 nextRunAt
          自動建單；目前 schema + 後台一覽完備，自動建單邏輯等綠界結帳上線後再開。
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="mt-8 bg-cream-100 border border-line rounded-lg p-6 text-sm leading-relaxed">
        <p className="font-medium mb-3">下一步開放路線</p>
        <ol className="list-decimal list-inside text-ink-soft space-y-1">
          <li>客戶在商品頁勾「訂閱」並選頻率（每月 / 每兩月 / 每季）</li>
          <li>結帳通過綠界後寫入 subscriptions（lines = 該訂單品項）</li>
          <li>Cron 每天檢查 nextRunAt，到期時用 customer.line_user_id /
            預設地址自動建立新訂單，狀態 pending_payment 等扣款（如使用記帳卡 / token）</li>
          <li>客戶端 /account/subscriptions 可暫停 / 跳過下個週期 / 取消</li>
        </ol>
      </section>
    </div>
  )
}
