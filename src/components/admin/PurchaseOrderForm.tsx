'use client'

import { useActionState, useMemo, useState } from 'react'
import {
  createPurchaseOrderAction,
  type PurchaseOrderState,
} from '@/server/actions/purchase-orders'
import {
  calcPurchase,
  type PriceRoundStrategy,
} from '@/lib/procurement-calc'
import { formatTwd } from '@/lib/format'

type PriceRoundStrategy_ = 'A' | 'B' | 'C' | 'D'

interface OptionWithCode {
  id: string
  name: string
  code?: string | null
}

interface TaxGroup {
  id: string
  name: string
  rateBp: number
}

interface ClearancePlan {
  id: string
  name: string
  amount: number
}

interface AgentPlan {
  id: string
  name: string
  baseFee: number
  handlingFee: number
}

interface PaymentOpt {
  id: string
  name: string
}

interface Props {
  sources: OptionWithCode[]
  categories: OptionWithCode[]
  taxGroups: TaxGroup[]
  clearancePlans: ClearancePlan[]
  agentPlans: AgentPlan[]
  paymentMethods: PaymentOpt[]
}

interface ItemDraft {
  uid: string
  categoryId: string
  taxRateGroupId: string
  nameZh: string
  nameJp: string
  spec: string
  description: string
  qty: number
  jpyUnitPrice: number
}

const ROUND_LABELS: Record<PriceRoundStrategy_, string> = {
  A: '尾數 9（159 / 249）',
  B: '50 倍數（650 / 1,250）',
  C: '100 倍數（700 / 1,300）',
  D: '智慧混合（依金額大小）',
}

function newItem(): ItemDraft {
  return {
    uid: Math.random().toString(36).slice(2),
    categoryId: '',
    taxRateGroupId: '',
    nameZh: '',
    nameJp: '',
    spec: '',
    description: '',
    qty: 1,
    jpyUnitPrice: 0,
  }
}

const inputCls = 'w-full border border-line rounded px-2 py-1 text-sm focus:outline-none focus:border-ink'
const numCls = inputCls + ' text-right'

export function PurchaseOrderForm({
  sources,
  categories,
  taxGroups,
  clearancePlans,
  agentPlans,
  paymentMethods,
}: Props) {
  const [state, formAction, pending] = useActionState<PurchaseOrderState, FormData>(
    createPurchaseOrderAction,
    {}
  )

  const today = new Date().toISOString().slice(0, 10)

  const [batchLabel, setBatchLabel] = useState('')
  const [sourceId, setSourceId] = useState(sources[0]?.id ?? '')
  const [purchaseDate, setPurchaseDate] = useState(today)
  const [exchangeRate, setExchangeRate] = useState('0.21359')
  const [agentPlanId, setAgentPlanId] = useState(agentPlans[0]?.id ?? '')
  const [clearancePlanId, setClearancePlanId] = useState(clearancePlans[0]?.id ?? '')
  const [packagingFeeTotal, setPackagingFeeTotal] = useState(0)
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id ?? '')
  const [markupRatePct, setMarkupRatePct] = useState(30)
  const [strategy, setStrategy] = useState<PriceRoundStrategy_>('B')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<ItemDraft[]>([newItem()])

  const taxMap = useMemo(
    () => new Map(taxGroups.map((t) => [t.id, t.rateBp])),
    [taxGroups]
  )
  const agentPlan = useMemo(
    () => agentPlans.find((p) => p.id === agentPlanId),
    [agentPlans, agentPlanId]
  )
  const clearancePlan = useMemo(
    () => clearancePlans.find((p) => p.id === clearancePlanId),
    [clearancePlans, clearancePlanId]
  )

  // Live calculation
  const calc = useMemo(() => {
    const exScaled = Math.round(parseFloat(exchangeRate || '0') * 100000)
    return calcPurchase(
      {
        exchangeRateScaled: exScaled,
        agentBaseFeeTwd: agentPlan?.baseFee ?? 0,
        agentHandlingFeeTwd: agentPlan?.handlingFee ?? 0,
        clearanceFeeAmountTwd: clearancePlan?.amount ?? 0,
        packagingFeeTotal,
        markupRateBp: Math.round(markupRatePct * 100),
        priceRoundStrategy: strategy as PriceRoundStrategy,
      },
      items.map((it) => ({
        qty: it.qty || 0,
        jpyUnitPrice: it.jpyUnitPrice || 0,
        importDutyRateBp: it.taxRateGroupId
          ? taxMap.get(it.taxRateGroupId) ?? 0
          : 0,
      }))
    )
  }, [exchangeRate, agentPlan, clearancePlan, packagingFeeTotal, markupRatePct, strategy, items, taxMap])

  const updateItem = (uid: string, patch: Partial<ItemDraft>) => {
    setItems((prev) =>
      prev.map((it) => (it.uid === uid ? { ...it, ...patch } : it))
    )
  }
  const removeItem = (uid: string) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.uid !== uid) : prev))

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
          {state.error}
        </div>
      )}

      {/* ───── 基本資訊 ───── */}
      <fieldset className="bg-white border border-line rounded-lg p-5 space-y-4">
        <legend className="text-xs uppercase tracking-widest text-ink-soft px-2">
          基本資訊
        </legend>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="採購單名稱" required>
            <input
              name="batchLabel"
              required
              value={batchLabel}
              onChange={(e) => setBatchLabel(e.target.value)}
              placeholder="例：2026/05 第一批"
              className={inputCls}
            />
          </Field>

          <Field label="採購日期" required>
            <input
              name="purchaseDate"
              type="date"
              required
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="採購來源">
            <select
              name="sourceId"
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className={inputCls + ' bg-white'}
            >
              <option value="">未指定</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code ? `[${s.code}] ` : ''}
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="匯率（日幣 → 台幣）" required>
            <input
              name="exchangeRate"
              type="number"
              step="0.00001"
              required
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              className={numCls}
            />
          </Field>

          <Field label="付款方式">
            <select
              name="paymentMethodId"
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
              className={inputCls + ' bg-white'}
            >
              <option value="">未指定</option>
              {paymentMethods.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
        </div>
      </fieldset>

      {/* ───── 費用方案 ───── */}
      <fieldset className="bg-white border border-line rounded-lg p-5 space-y-4">
        <legend className="text-xs uppercase tracking-widest text-ink-soft px-2">
          費用方案
        </legend>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="代購方案">
            <select
              name="agentPlanId"
              value={agentPlanId}
              onChange={(e) => setAgentPlanId(e.target.value)}
              className={inputCls + ' bg-white'}
            >
              <option value="">未指定</option>
              {agentPlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}（基本 {p.baseFee} / 手續 {p.handlingFee}）
                </option>
              ))}
            </select>
          </Field>

          <Field label="報關方案">
            <select
              name="clearanceFeePlanId"
              value={clearancePlanId}
              onChange={(e) => setClearancePlanId(e.target.value)}
              className={inputCls + ' bg-white'}
            >
              <option value="">未指定</option>
              {clearancePlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}（{formatTwd(p.amount)}）
                </option>
              ))}
            </select>
          </Field>

          <Field label="包材總額（NT$）">
            <input
              name="packagingFeeTotal"
              type="number"
              min={0}
              value={packagingFeeTotal}
              onChange={(e) => setPackagingFeeTotal(Number(e.target.value) || 0)}
              className={numCls}
            />
          </Field>

          <Field label="加成倍率（%）">
            <input
              name="markupRatePct"
              type="number"
              min={0}
              max={500}
              step="1"
              value={markupRatePct}
              onChange={(e) => setMarkupRatePct(Number(e.target.value) || 0)}
              className={numCls}
            />
          </Field>

          <Field label="售價美化策略">
            <select
              name="priceRoundStrategy"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as PriceRoundStrategy_)}
              className={inputCls + ' bg-white'}
            >
              {(['A', 'B', 'C', 'D'] as const).map((s) => (
                <option key={s} value={s}>
                  {s} — {ROUND_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </fieldset>

      {/* ───── 採購明細 ───── */}
      <fieldset className="bg-white border border-line rounded-lg p-5 space-y-4">
        <legend className="text-xs uppercase tracking-widest text-ink-soft px-2">
          採購明細（{items.length} 項）
        </legend>

        <div className="space-y-3">
          {items.map((it, i) => {
            const c = calc.items[i]
            return (
              <div
                key={it.uid}
                className="border border-line rounded-md p-3 bg-cream-50/30 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-soft">#{i + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(it.uid)}
                      className="text-xs text-danger hover:underline"
                    >
                      移除
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <select
                    name="item.categoryId"
                    value={it.categoryId}
                    onChange={(e) => updateItem(it.uid, { categoryId: e.target.value })}
                    className={inputCls + ' bg-white'}
                  >
                    <option value="">分類</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code ? `[${c.code}] ` : ''}{c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    name="item.taxRateGroupId"
                    value={it.taxRateGroupId}
                    onChange={(e) =>
                      updateItem(it.uid, { taxRateGroupId: e.target.value })
                    }
                    className={inputCls + ' bg-white'}
                  >
                    <option value="">稅率分組</option>
                    {taxGroups.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}（{(t.rateBp / 100).toFixed(2)}%）
                      </option>
                    ))}
                  </select>

                  <input
                    name="item.qty"
                    type="number"
                    min={1}
                    value={it.qty}
                    onChange={(e) =>
                      updateItem(it.uid, { qty: Number(e.target.value) || 0 })
                    }
                    placeholder="數量"
                    className={numCls}
                  />

                  <input
                    name="item.jpyUnitPrice"
                    type="number"
                    min={0}
                    value={it.jpyUnitPrice}
                    onChange={(e) =>
                      updateItem(it.uid, {
                        jpyUnitPrice: Number(e.target.value) || 0,
                      })
                    }
                    placeholder="日幣單價"
                    className={numCls}
                  />
                </div>

                <input
                  name="item.nameZh"
                  required
                  value={it.nameZh}
                  onChange={(e) => updateItem(it.uid, { nameZh: e.target.value })}
                  placeholder="中文品名"
                  className={inputCls}
                />

                <input
                  name="item.nameJp"
                  value={it.nameJp}
                  onChange={(e) => updateItem(it.uid, { nameJp: e.target.value })}
                  placeholder="日文品名（選填）"
                  className={inputCls}
                />

                <textarea
                  name="item.spec"
                  rows={2}
                  value={it.spec}
                  onChange={(e) => updateItem(it.uid, { spec: e.target.value })}
                  placeholder="規格（材質、顏色、尺寸…）"
                  className={inputCls}
                />

                <textarea
                  name="item.description"
                  rows={2}
                  value={it.description}
                  onChange={(e) => updateItem(it.uid, { description: e.target.value })}
                  placeholder="產品說明（選填）"
                  className={inputCls}
                />

                {/* Live calc for this row */}
                {it.qty > 0 && it.jpyUnitPrice > 0 && c && (
                  <div className="bg-white border border-line rounded text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 p-3">
                    <Stat label="進貨額(台)" value={formatTwd(c.twdSubtotal)} />
                    <Stat label="進口稅+營業稅" value={formatTwd(c.importDuty + c.promoFee + c.vat)} />
                    <Stat label="雜支分攤" value={formatTwd(c.clearanceFeeShare + c.packagingFeeShare + c.agentFeeShare)} />
                    <Stat label="到岸成本" value={formatTwd(c.landedCostPerUnit) + ' / 件'} />
                    <Stat label="建議售價" value={formatTwd(c.suggestedPrice)} highlight />
                    <Stat label="毛利/件" value={formatTwd(c.marginPerUnit)} />
                    <Stat label="總成本" value={formatTwd(c.itemCost)} />
                    <Stat label="總毛利" value={formatTwd(c.marginTotal)} highlight />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => setItems((prev) => [...prev, newItem()])}
          className="w-full border border-dashed border-line py-2 rounded text-sm text-ink-soft hover:border-ink hover:text-ink"
        >
          + 加一個明細
        </button>
      </fieldset>

      {/* ───── 整批 P&L 摘要 ───── */}
      <fieldset className="bg-cream-50 border border-line rounded-lg p-5">
        <legend className="text-xs uppercase tracking-widest text-ink-soft px-2">
          整批 P&L 摘要
        </legend>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Stat label="總件數" value={`${calc.totals.totalUnits} 件`} />
          <Stat label="日幣總額" value={`¥ ${calc.totals.jpyTotal.toLocaleString()}`} />
          <Stat label="台幣進貨額" value={formatTwd(calc.totals.twdTotal)} />
          <Stat label="總成本" value={formatTwd(calc.totals.totalCost)} />

          <Stat label="進口稅總計" value={formatTwd(calc.totals.totalImportDuty)} />
          <Stat label="營業稅總計" value={formatTwd(calc.totals.totalVat)} />
          <Stat label="雜支總計" value={formatTwd(calc.totals.totalClearance + calc.totals.totalPackaging + calc.totals.totalAgent)} />
          <Stat label="推廣費" value={formatTwd(calc.totals.totalPromoFee)} />

          <Stat label="建議總營收" value={formatTwd(calc.totals.suggestedRevenue)} highlight />
          <Stat label="總毛利" value={formatTwd(calc.totals.totalMargin)} highlight />
          <Stat label="毛利率" value={`${calc.totals.marginRatePct}%`} highlight />
        </div>
      </fieldset>

      <div>
        <Field label="備註">
          <textarea
            name="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputCls}
            placeholder="採購單備註（選填）"
          />
        </Field>
      </div>

      <div className="flex gap-3 sticky bottom-0 bg-cream-50 border-t border-line py-3 -mx-6 sm:-mx-8 px-6 sm:px-8">
        <button
          type="submit"
          disabled={pending}
          className="bg-ink text-cream px-5 py-2.5 rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50"
        >
          {pending ? '儲存中⋯' : '儲存採購單'}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-sm mb-1.5 text-ink-soft">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
    </label>
  )
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-ink-soft mb-0.5">
        {label}
      </p>
      <p className={'font-medium ' + (highlight ? 'text-accent' : '')}>{value}</p>
    </div>
  )
}
