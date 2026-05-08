import Link from 'next/link'
import { listTiers } from '@/server/services/MemberTierService'
import { deleteTierAction } from '@/server/actions/member-tiers'
import { formatTwd } from '@/lib/format'
import {
  TierBronzeIllustration,
  TierSilverIllustration,
  TierGoldIllustration,
} from '@/components/shared/BrandIllustrations'

function pickBadge(name: string, threshold: number) {
  if (/金|gold/i.test(name)) return TierGoldIllustration
  if (/銀|silver/i.test(name)) return TierSilverIllustration
  if (/銅|bronze/i.test(name)) return TierBronzeIllustration
  if (threshold >= 30000) return TierGoldIllustration
  if (threshold >= 5000) return TierSilverIllustration
  return TierBronzeIllustration
}

export const dynamic = 'force-dynamic'

export default async function MemberTiersPage() {
  const tiers = await listTiers()

  return (
    <div className="p-6 sm:p-8 max-w-4xl">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl mb-1">會員分級</h1>
          <p className="text-ink-soft text-sm">
            依累積消費自動升級。系統取門檻 ≤ 客戶累積消費的最高一級。
          </p>
        </div>
        <Link
          href="/admin/member-tiers/new"
          className="font-jp text-sm bg-ink text-cream px-4 py-2 rounded-md tracking-wider"
        >
          + 新增等級
        </Link>
      </header>

      {tiers.length === 0 ? (
        <div className="bg-white border border-line border-dashed rounded-lg p-12 text-center text-ink-soft text-sm">
          尚未建立任何等級。建議先建 3 級：銅 NT$0 / 銀 NT$5,000 / 金 NT$30,000
        </div>
      ) : (
        <div className="bg-white border border-line rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-ink-soft">
              <tr>
                <th className="text-left px-4 py-3 font-normal">名稱</th>
                <th className="text-right px-4 py-3 font-normal">門檻</th>
                <th className="text-right px-4 py-3 font-normal">折扣</th>
                <th className="text-right px-4 py-3 font-normal">免運門檻</th>
                <th className="text-right px-4 py-3 font-normal">生日金</th>
                <th className="text-right px-4 py-3 font-normal">操作</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t) => {
                const Badge = pickBadge(t.name, t.thresholdTwd)
                return (
                <tr key={t.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-3"
                      style={t.color ? { color: t.color } : undefined}
                    >
                      <Badge className="w-7 h-9 flex-shrink-0" />
                      <span>
                        {t.name}
                        {t.nameJp && (
                          <span className="text-ink-soft text-xs ml-2">{t.nameJp}</span>
                        )}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{formatTwd(t.thresholdTwd)}</td>
                  <td className="px-4 py-3 text-right">
                    {t.discountBp > 0 ? `${(t.discountBp / 100).toFixed(t.discountBp % 100 === 0 ? 0 : 1)}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {t.freeShipMinTwd != null ? formatTwd(t.freeShipMinTwd) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {t.birthdayBonusTwd > 0 ? formatTwd(t.birthdayBonusTwd) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/member-tiers/${t.id}`}
                      className="text-xs underline mr-3 hover:text-accent"
                    >
                      編輯
                    </Link>
                    <form
                      action={deleteTierAction.bind(null, t.id)}
                      className="inline"
                    >
                      <button
                        type="submit"
                        className="text-xs text-danger hover:underline"
                      >
                        刪除
                      </button>
                    </form>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-ink-soft mt-4 leading-relaxed">
        💡 折扣以 basis points 儲存（500 = 5%、1000 = 10%）。新等級會在客戶下一張訂單付款時生效。
      </p>
    </div>
  )
}
