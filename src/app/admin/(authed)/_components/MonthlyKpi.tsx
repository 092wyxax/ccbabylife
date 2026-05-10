import { sql, eq, and, gte, inArray } from 'drizzle-orm'
import { db } from '@/db/client'
import { orders } from '@/db/schema'
import { returnRequests } from '@/db/schema/return_requests'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { formatTwd } from '@/lib/format'

/**
 * PLAYBOOK §14 月度檢視儀表板.
 *
 * Shows 4 auto-computed metrics (本月訂單數、營收、客單、退貨率) + a
 * read-only target table for the indicators we don't yet wire to data
 * sources (Threads 追蹤、LINE 好友、推播點擊率).
 */
export async function MonthlyKpi() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)

  const orgWhere = eq(orders.orgId, DEFAULT_ORG_ID)
  const monthWhere = and(orgWhere, gte(orders.createdAt, monthStart))
  const NON_REVENUE_STATUSES = ['cancelled', 'refunded', 'pending_payment'] as const

  const [orderAgg, returnAgg] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)::int`,
        revenue: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.status} not in ('cancelled','refunded','pending_payment')), 0)::int`,
        paidCount: sql<number>`count(*) filter (where ${orders.status} not in ('cancelled','refunded','pending_payment'))::int`,
      })
      .from(orders)
      .where(monthWhere),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(returnRequests)
      .where(
        and(
          eq(returnRequests.orgId, DEFAULT_ORG_ID),
          gte(returnRequests.createdAt, monthStart)
        )
      ),
  ])

  const monthOrders = orderAgg[0]?.count ?? 0
  const monthRevenue = orderAgg[0]?.revenue ?? 0
  const paidCount = orderAgg[0]?.paidCount ?? 0
  const monthReturns = returnAgg[0]?.count ?? 0
  const avgOrder = paidCount > 0 ? Math.round(monthRevenue / paidCount) : 0
  const returnRate = paidCount > 0 ? (monthReturns / paidCount) * 100 : 0

  const monthLabel = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`

  const cards = [
    { label: '本月訂單', value: monthOrders.toString(), sub: '依下單時間' },
    { label: '本月營收', value: formatTwd(monthRevenue), sub: '不含取消 / 退款 / 未付' },
    { label: '客單價', value: avgOrder > 0 ? formatTwd(avgOrder) : '—', sub: 'PLAYBOOK 目標 NT$1,400–2,200' },
    {
      label: '退貨率',
      value: paidCount > 0 ? `${returnRate.toFixed(1)}%` : '—',
      sub: 'PLAYBOOK 目標 < 5%',
      warn: returnRate >= 5,
    },
  ]

  // PLAYBOOK §14 milestone targets — read-only reference
  const targets = [
    { metric: 'Threads 追蹤', m1: '500', m3: '1,500', m6: '—' },
    { metric: 'LINE 好友', m1: '50', m3: '350', m6: '1,000' },
    { metric: '月訂單', m1: '5–10', m3: '50', m6: '200+' },
    { metric: '月營收', m1: 'NT$1–3 萬', m3: 'NT$10–18 萬', m6: 'NT$40 萬' },
    { metric: 'LINE 推播點擊率', m1: '> 12%', m3: '> 12%', m6: '> 12%' },
    { metric: 'LINE 封鎖率', m1: '< 25%', m3: '< 25%', m6: '< 25%' },
    { metric: '回頭客比例', m1: '—', m3: '—', m6: '> 25%' },
    { metric: 'LTV/CAC', m1: '—', m3: '—', m6: '> 8' },
  ]

  return (
    <section className="bg-white border border-line rounded-lg overflow-hidden">
      <header className="px-5 sm:px-6 py-4 border-b border-line">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg">本月 KPI · {monthLabel}</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              PLAYBOOK §14 — 每月底花 30 分鐘檢視，落差 &gt; 30% 就調整 ROADMAP 排程。
            </p>
          </div>
        </div>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line">
        {cards.map((c) => (
          <div key={c.label} className="bg-white p-4 sm:p-5">
            <p className="text-[11px] uppercase tracking-widest text-ink-soft mb-2">
              {c.label}
            </p>
            <p
              className={`text-2xl font-medium tabular-nums ${
                c.warn ? 'text-danger' : ''
              }`}
            >
              {c.value}
            </p>
            <p className="text-[11px] text-ink-soft mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      <details className="border-t border-line">
        <summary className="px-5 sm:px-6 py-3 text-xs text-ink-soft cursor-pointer hover:text-ink select-none">
          展開 6 個月里程碑目標 ↓
        </summary>
        <div className="overflow-x-auto px-5 sm:px-6 pb-5">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-ink-soft text-left">
                <th className="py-2 font-normal">指標</th>
                <th className="py-2 font-normal text-right">M1</th>
                <th className="py-2 font-normal text-right">M3</th>
                <th className="py-2 font-normal text-right">M6</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((t) => (
                <tr key={t.metric} className="border-t border-line/60">
                  <td className="py-2">{t.metric}</td>
                  <td className="py-2 text-right tabular-nums">{t.m1}</td>
                  <td className="py-2 text-right tabular-nums">{t.m3}</td>
                  <td className="py-2 text-right tabular-nums">{t.m6}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-ink-soft mt-3">
            Threads 追蹤、LINE 好友、推播點擊率 / 封鎖率 目前需手動到對應後台查看 —
            未來可串接 LINE Analytics API 自動帶入。
          </p>
        </div>
      </details>
    </section>
  )
}
