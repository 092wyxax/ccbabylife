import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { products } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import {
  getPurchaseDetail,
  listSuppliers,
  listValidPurchaseTransitions,
} from '@/server/services/PurchaseService'
import { PurchaseStatusForm } from '@/components/admin/PurchaseStatusForm'
import { PurchaseItemAddForm } from '@/components/admin/PurchaseItemAddForm'
import {
  PURCHASE_STATUS_LABEL,
  purchaseStatusBadge,
  SUPPLIER_TYPE_LABEL,
} from '@/lib/purchase-status'
import { formatJpy } from '@/lib/format'
import { removePurchaseItemAction } from '@/server/actions/purchases'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PurchaseDetailPage({ params }: Props) {
  const { id } = await params
  const detail = await getPurchaseDetail(id)
  if (!detail) notFound()

  const [allSuppliers, allProducts] = await Promise.all([
    listSuppliers(),
    db
      .select({
        id: products.id,
        nameZh: products.nameZh,
        priceJpy: products.priceJpy,
        costJpy: products.costJpy,
      })
      .from(products)
      .where(eq(products.orgId, DEFAULT_ORG_ID)),
  ])

  const { purchase, supplier, items } = detail
  const validNext = listValidPurchaseTransitions(purchase.status)

  return (
    <div className="p-8 max-w-5xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/purchases" className="hover:text-ink">採購管理</Link>
        <span className="mx-2">/</span>
        <span>{purchase.batchLabel}</span>
      </nav>

      <header className="flex items-start justify-between mb-6 pb-4 border-b border-line">
        <div>
          <h1 className="font-serif text-2xl mb-1">{purchase.batchLabel}</h1>
          <p className="text-ink-soft text-sm">
            {supplier ? (
              <>
                {supplier.name}
                {' · '}
                {SUPPLIER_TYPE_LABEL[supplier.type]}
              </>
            ) : (
              '未指定供應商'
            )}
            {' · '}
            建立於 {new Date(purchase.createdAt).toLocaleDateString('zh-TW')}
          </p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full ${purchaseStatusBadge(purchase.status)}`}>
          {PURCHASE_STATUS_LABEL[purchase.status]}
        </span>
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-8">
          <section>
            <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
              採購項目（{items.length} 筆）
            </h2>
            <div className="bg-white border border-line rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-cream-100 text-ink-soft">
                  <tr>
                    <th className="text-left px-4 py-2 font-normal">品名</th>
                    <th className="text-right px-4 py-2 font-normal">單價</th>
                    <th className="text-right px-4 py-2 font-normal">實際單價</th>
                    <th className="text-right px-4 py-2 font-normal">數量</th>
                    <th className="text-right px-4 py-2 font-normal">小計</th>
                    <th className="text-left px-4 py-2 font-normal w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-ink-soft text-xs">
                        尚未加入項目
                      </td>
                    </tr>
                  ) : (
                    items.map((it) => {
                      const lineTotal = it.quantity * (it.actualUnitJpy ?? it.unitJpy)
                      return (
                        <tr key={it.id} className="border-t border-line">
                          <td className="px-4 py-2">
                            <p>{it.productNameSnapshot}</p>
                            {it.notes && (
                              <p className="text-xs text-ink-soft mt-0.5">{it.notes}</p>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right text-ink-soft">
                            {formatJpy(it.unitJpy)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {it.actualUnitJpy != null ? (
                              <span className={it.actualUnitJpy !== it.unitJpy ? 'text-warning' : ''}>
                                {formatJpy(it.actualUnitJpy)}
                              </span>
                            ) : (
                              <span className="text-ink-soft">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right text-ink-soft">{it.quantity}</td>
                          <td className="px-4 py-2 text-right font-medium">
                            {formatJpy(lineTotal)}
                          </td>
                          <td className="px-4 py-2">
                            <form
                              action={async () => {
                                'use server'
                                await removePurchaseItemAction(it.id, purchase.id)
                              }}
                            >
                              <button
                                type="submit"
                                className="text-xs text-ink-soft hover:text-danger underline"
                              >
                                移除
                              </button>
                            </form>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {(purchase.status === 'planning' || purchase.status === 'submitted') && (
            <section>
              <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
                新增項目
              </h2>
              <div className="bg-white border border-line rounded-lg p-4">
                <PurchaseItemAddForm purchaseId={purchase.id} products={allProducts} />
                <p className="text-xs text-ink-soft mt-3 leading-relaxed">
                  品名可從現有商品下拉自動補上，也能直接打字（適用未上架但要進的商品）。
                  「單價」是預估，實際支付後可在每行編輯「實際單價」。
                </p>
              </div>
            </section>
          )}

          {purchase.notes && (
            <section>
              <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
                備註
              </h2>
              <p className="bg-cream-100 border border-line rounded-lg p-4 text-sm whitespace-pre-wrap">
                {purchase.notes}
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="bg-white border border-line rounded-lg p-5">
            <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
              變更狀態
            </h2>
            <PurchaseStatusForm
              purchaseId={purchase.id}
              current={purchase.status}
              validNext={validNext}
            />
            <p className="text-xs text-ink-soft mt-3 leading-relaxed">
              規劃中 → 已下單 → 日本到貨 → 已完成。每個轉移由系統強制檢查。
            </p>
          </section>

          <section className="bg-white border border-line rounded-lg p-5 text-sm space-y-2">
            <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-2">
              金額
            </h2>
            <Row label="預估總額" value={formatJpy(purchase.expectedJpyTotal)} bold />
            {purchase.actualJpyTotal != null && (
              <Row
                label="實際總額"
                value={formatJpy(purchase.actualJpyTotal)}
                hint={
                  purchase.actualJpyTotal !== purchase.expectedJpyTotal
                    ? `差 ${formatJpy(Math.abs(purchase.actualJpyTotal - purchase.expectedJpyTotal))}`
                    : undefined
                }
              />
            )}
          </section>

          <section className="bg-cream-100 border border-line rounded-lg p-4 text-xs text-ink-soft leading-relaxed">
            <p className="font-medium text-ink mb-1">後續開發</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>每行項目的「實際單價」內聯編輯</li>
              <li>批次與訂單關聯（哪些訂單由此批次出貨）</li>
              <li>採購單列印</li>
            </ul>
            {allSuppliers.length === 0 && (
              <p className="mt-3 pt-3 border-t border-line text-ink">
                尚無供應商，請先到{' '}
                <Link href="/admin/purchases/suppliers" className="underline">
                  供應商管理
                </Link>{' '}
                建立。
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}

function Row({ label, value, bold, hint }: { label: string; value: string; bold?: boolean; hint?: string }) {
  return (
    <div className="flex justify-between items-baseline gap-3">
      <span className="text-ink-soft">{label}</span>
      <div className="text-right">
        <span className={bold ? 'font-medium' : ''}>{value}</span>
        {hint && <p className="text-xs text-ink-soft">{hint}</p>}
      </div>
    </div>
  )
}
