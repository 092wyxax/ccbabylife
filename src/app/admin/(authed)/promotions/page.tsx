import Link from 'next/link'
import {
  listAllThresholdGifts,
  listAllAddons,
} from '@/server/services/PromotionService'
import {
  deleteGiftAction,
  deleteAddonAction,
} from '@/server/actions/promotions'
import { formatTwd } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function PromotionsPage() {
  const [gifts, addons] = await Promise.all([
    listAllThresholdGifts(),
    listAllAddons(),
  ])

  return (
    <div className="p-6 sm:p-8 max-w-5xl space-y-12">
      <header>
        <h1 className="font-serif text-2xl mb-1">行銷活動 · 滿額贈 / 加購</h1>
        <p className="text-ink-soft text-sm">
          滿額贈：客戶購物車滿 X 元自動加贈品。加購：購買主商品時頁面顯示折扣加購選項。
        </p>
      </header>

      {/* ── Threshold gifts ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-serif text-xl">滿額贈</h2>
            <p className="text-xs text-ink-soft mt-1">
              cart subtotal ≥ 門檻 → 自動贈品（多筆活動由小到大套用）
            </p>
          </div>
          <Link
            href="/admin/promotions/gifts/new"
            className="font-jp text-sm bg-ink text-cream px-3 py-1.5 rounded-md tracking-wider"
          >
            + 新增滿額贈
          </Link>
        </div>

        {gifts.length === 0 ? (
          <div className="bg-white border border-line border-dashed rounded-lg p-8 text-center text-ink-soft text-sm">
            尚未設定。常見：滿 NT$1,500 送濕紙巾
          </div>
        ) : (
          <div className="bg-white border border-line rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 text-ink-soft">
                <tr>
                  <th className="text-left px-4 py-3 font-normal">活動名稱</th>
                  <th className="text-right px-4 py-3 font-normal">門檻</th>
                  <th className="text-left px-4 py-3 font-normal">贈品</th>
                  <th className="text-right px-4 py-3 font-normal">數量</th>
                  <th className="text-left px-4 py-3 font-normal">狀態</th>
                  <th className="text-right px-4 py-3 font-normal">操作</th>
                </tr>
              </thead>
              <tbody>
                {gifts.map(({ gift, product }) => (
                  <tr key={gift.id} className="border-t border-line">
                    <td className="px-4 py-3">{gift.name}</td>
                    <td className="px-4 py-3 text-right">{formatTwd(gift.thresholdTwd)}</td>
                    <td className="px-4 py-3">{product?.nameZh ?? '— (商品已刪除)'}</td>
                    <td className="px-4 py-3 text-right">× {gift.quantity}</td>
                    <td className="px-4 py-3">
                      {gift.isActive ? (
                        <span className="text-xs text-success">啟用</span>
                      ) : (
                        <span className="text-xs text-ink-soft">停用</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/promotions/gifts/${gift.id}`}
                        className="text-xs underline mr-3 hover:text-accent"
                      >
                        編輯
                      </Link>
                      <form action={deleteGiftAction.bind(null, gift.id)} className="inline">
                        <button type="submit" className="text-xs text-danger hover:underline">
                          刪除
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Product addons ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-serif text-xl">加購商品</h2>
            <p className="text-xs text-ink-soft mt-1">
              客戶購買「主商品」時，頁面下方顯示加購商品 + 加購價
            </p>
          </div>
          <Link
            href="/admin/promotions/addons/new"
            className="font-jp text-sm bg-ink text-cream px-3 py-1.5 rounded-md tracking-wider"
          >
            + 新增加購
          </Link>
        </div>

        {addons.length === 0 ? (
          <div className="bg-white border border-line border-dashed rounded-lg p-8 text-center text-ink-soft text-sm">
            尚未設定。常見：買奶瓶 → 加購奶瓶刷 NT$99
          </div>
        ) : (
          <div className="bg-white border border-line rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 text-ink-soft">
                <tr>
                  <th className="text-left px-4 py-3 font-normal">主商品</th>
                  <th className="text-left px-4 py-3 font-normal">加購商品</th>
                  <th className="text-right px-4 py-3 font-normal">加購價</th>
                  <th className="text-right px-4 py-3 font-normal">原價</th>
                  <th className="text-right px-4 py-3 font-normal">最多</th>
                  <th className="text-left px-4 py-3 font-normal">狀態</th>
                  <th className="text-right px-4 py-3 font-normal">操作</th>
                </tr>
              </thead>
              <tbody>
                {addons.map(({ addon, main, sub }) => (
                  <tr key={addon.id} className="border-t border-line">
                    <td className="px-4 py-3 text-xs">{main?.nameZh ?? '— 已刪除'}</td>
                    <td className="px-4 py-3 text-xs">{sub?.nameZh ?? '— 已刪除'}</td>
                    <td className="px-4 py-3 text-right text-accent font-medium">
                      {formatTwd(addon.addonPriceTwd)}
                    </td>
                    <td className="px-4 py-3 text-right text-ink-soft line-through text-xs">
                      {sub ? formatTwd(sub.priceTwd) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-xs">× {addon.maxAddonQty}</td>
                    <td className="px-4 py-3">
                      {addon.isActive ? (
                        <span className="text-xs text-success">啟用</span>
                      ) : (
                        <span className="text-xs text-ink-soft">停用</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={deleteAddonAction.bind(null, addon.id)} className="inline">
                        <button type="submit" className="text-xs text-danger hover:underline">
                          刪除
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
