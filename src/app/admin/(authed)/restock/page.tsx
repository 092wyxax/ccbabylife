import { desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { restockSubscriptions, products } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { sendRestockNotificationAction } from '@/server/actions/restock'

export default async function RestockSubscribersPage() {
  const rows = await db
    .select({
      sub: restockSubscriptions,
      product: products,
    })
    .from(restockSubscriptions)
    .leftJoin(products, eq(products.id, restockSubscriptions.productId))
    .where(eq(restockSubscriptions.orgId, DEFAULT_ORG_ID))
    .orderBy(desc(restockSubscriptions.createdAt))
    .limit(200)

  return (
    <div className="p-8 max-w-5xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl mb-1">補貨通知名單</h1>
        <p className="text-ink-soft text-sm">
          客戶在售完商品頁登記。商品補貨後可手動觸發通知（Resend 接通後自動寄）。
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="bg-white border border-line rounded-lg p-12 text-center text-ink-soft">
          沒有人登記。
        </div>
      ) : (
        <div className="bg-white border border-line rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-ink-soft">
              <tr>
                <th className="text-left px-4 py-3 font-normal">商品</th>
                <th className="text-left px-4 py-3 font-normal">Email</th>
                <th className="text-left px-4 py-3 font-normal">登記時間</th>
                <th className="text-left px-4 py-3 font-normal">通知狀態</th>
                <th className="text-left px-4 py-3 font-normal">動作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ sub, product }) => (
                <tr key={sub.id} className="border-t border-line">
                  <td className="px-4 py-3">{product?.nameZh ?? '—'}</td>
                  <td className="px-4 py-3 text-xs">{sub.email}</td>
                  <td className="px-4 py-3 text-xs text-ink-soft">
                    {new Date(sub.createdAt).toLocaleString('zh-TW')}
                  </td>
                  <td className="px-4 py-3">
                    {sub.notified ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-success/15 text-ink">
                        已通知 {sub.notifiedAt && new Date(sub.notifiedAt).toLocaleDateString('zh-TW')}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-warning/20 text-ink">
                        待通知
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!sub.notified && (
                      <form action={sendRestockNotificationAction}>
                        <input type="hidden" name="subId" value={sub.id} />
                        <button
                          type="submit"
                          className="text-xs px-2 py-1 rounded border border-line hover:bg-ink hover:text-cream transition-colors"
                        >
                          通知
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
    </div>
  )
}
