import Link from 'next/link'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  agentServicePlans,
  clearanceFeePlans,
  paymentMethods,
  taxRateGroups,
} from '@/db/schema/procurement_settings'
import { sources } from '@/db/schema/sources'
import { categories } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireRole } from '@/server/services/AdminAuthService'
import { PurchaseOrderForm } from '@/components/admin/PurchaseOrderForm'

export const dynamic = 'force-dynamic'

export default async function NewPurchaseOrderPage() {
  await requireRole(['owner', 'manager', 'buyer'])

  const [sourceRows, categoryRows, taxRows, clearRows, agentRows, paymentRows] =
    await Promise.all([
      db.select().from(sources).where(eq(sources.orgId, DEFAULT_ORG_ID)).orderBy(asc(sources.name)),
      db.select().from(categories).where(eq(categories.orgId, DEFAULT_ORG_ID)).orderBy(asc(categories.name)),
      db.select().from(taxRateGroups).where(eq(taxRateGroups.orgId, DEFAULT_ORG_ID)).orderBy(asc(taxRateGroups.name)),
      db.select().from(clearanceFeePlans).where(eq(clearanceFeePlans.orgId, DEFAULT_ORG_ID)).orderBy(asc(clearanceFeePlans.name)),
      db.select().from(agentServicePlans).where(eq(agentServicePlans.orgId, DEFAULT_ORG_ID)).orderBy(asc(agentServicePlans.name)),
      db.select().from(paymentMethods).where(eq(paymentMethods.orgId, DEFAULT_ORG_ID)).orderBy(asc(paymentMethods.name)),
    ])

  const settingsReady =
    taxRows.length > 0 && clearRows.length > 0 && agentRows.length > 0 && paymentRows.length > 0

  return (
    <div className="p-6 sm:p-8">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/purchases" className="hover:text-ink">進貨單</Link>
        <span className="mx-2">/</span>
        <span>新建</span>
      </nav>
      <h1 className="font-serif text-2xl mb-1">新建進貨單</h1>
      <p className="text-ink-soft text-sm mb-6">
        填日幣單價跟數量，後台會自動算進口稅、推廣費、營業稅、雜支分攤、單價到岸成本與建議售價。
      </p>

      {!settingsReady && (
        <div className="mb-6 bg-cream-50 border border-line rounded-md p-4 text-sm">
          <p className="font-medium mb-1">請先到「進貨設定」填好以下幾項：</p>
          <ul className="list-disc list-inside text-ink-soft text-xs space-y-0.5">
            {taxRows.length === 0 && <li>稅率分組</li>}
            {clearRows.length === 0 && <li>報關雜支方案</li>}
            {agentRows.length === 0 && <li>代購方案</li>}
            {paymentRows.length === 0 && <li>付款方式</li>}
          </ul>
          <Link
            href="/admin/procurement-settings"
            className="text-xs text-accent hover:underline mt-2 inline-block"
          >
            前往進貨設定 →
          </Link>
        </div>
      )}

      <PurchaseOrderForm
        sources={sourceRows.map((s) => ({ id: s.id, name: s.name, code: s.code }))}
        categories={categoryRows.map((c) => ({ id: c.id, name: c.name, code: c.code }))}
        taxGroups={taxRows.map((t) => ({ id: t.id, name: t.name, rateBp: t.importDutyRateBp }))}
        clearancePlans={clearRows.map((p) => ({ id: p.id, name: p.name, amount: p.amountTwd }))}
        agentPlans={agentRows.map((p) => ({
          id: p.id,
          name: p.name,
          baseFee: p.baseFeeTwd,
          handlingFee: p.handlingFeeTwd,
        }))}
        paymentMethods={paymentRows.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  )
}
