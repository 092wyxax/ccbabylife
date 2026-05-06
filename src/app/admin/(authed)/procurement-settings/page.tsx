import { asc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  taxRateGroups,
  clearanceFeePlans,
  agentServicePlans,
  paymentMethods,
} from '@/db/schema/procurement_settings'
import { sources } from '@/db/schema/sources'
import { categories } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireRole } from '@/server/services/AdminAuthService'
import {
  updateSourceCodeAction,
  createCategoryAction,
  updateCategoryCodeAction,
  deleteCategoryAction,
  createTaxRateGroupAction,
  updateTaxRateGroupAction,
  deleteTaxRateGroupAction,
  createClearanceFeePlanAction,
  updateClearanceFeePlanAction,
  deleteClearanceFeePlanAction,
  createAgentPlanAction,
  updateAgentPlanAction,
  deleteAgentPlanAction,
  createPaymentMethodAction,
  updatePaymentMethodAction,
  deletePaymentMethodAction,
} from '@/server/actions/procurement-settings'

export const dynamic = 'force-dynamic'

const inputCls = 'w-full border border-line rounded px-2 py-1 text-sm focus:outline-none focus:border-ink'
const numCls = inputCls + ' text-right'
const codeCls = inputCls + ' font-mono uppercase text-center'

export default async function ProcurementSettingsPage() {
  await requireRole(['owner', 'manager', 'buyer'])

  const [sourceRows, categoryRows, taxRows, clearRows, agentRows, payRows] =
    await Promise.all([
      db.select().from(sources).where(eq(sources.orgId, DEFAULT_ORG_ID)).orderBy(asc(sources.name)),
      db.select().from(categories).where(eq(categories.orgId, DEFAULT_ORG_ID)).orderBy(asc(categories.name)),
      db.select().from(taxRateGroups).where(eq(taxRateGroups.orgId, DEFAULT_ORG_ID)).orderBy(asc(taxRateGroups.name)),
      db.select().from(clearanceFeePlans).where(eq(clearanceFeePlans.orgId, DEFAULT_ORG_ID)).orderBy(asc(clearanceFeePlans.name)),
      db.select().from(agentServicePlans).where(eq(agentServicePlans.orgId, DEFAULT_ORG_ID)).orderBy(asc(agentServicePlans.name)),
      db.select().from(paymentMethods).where(eq(paymentMethods.orgId, DEFAULT_ORG_ID)).orderBy(asc(paymentMethods.name)),
    ])

  return (
    <div className="p-6 sm:p-8 max-w-5xl space-y-12">
      <header>
        <h1 className="font-serif text-2xl mb-1">進貨設定</h1>
        <p className="text-ink-soft text-sm">
          所有可在進貨單下拉選擇的選項都在這裡管理。改完即時生效，進貨單會看到最新值。
        </p>
      </header>

      {/* 1. 採購來源 SKU 簡碼 */}
      <Section
        title="採購來源 SKU 簡碼"
        description="編輯既有「採購商」的簡碼（用於商品 SKU 開頭，例：NSW、NSE、SC）。新增 / 刪除採購來源請到「採購商」頁。"
      >
        <div className="mb-3">
          <a
            href="/admin/sources/new"
            className="inline-block text-xs bg-ink text-cream px-3 py-1.5 rounded hover:bg-accent"
          >
            + 新增採購來源 →
          </a>
          <a
            href="/admin/sources"
            className="inline-block text-xs text-ink-soft hover:text-ink underline ml-3"
          >
            管理所有來源
          </a>
        </div>
        {sourceRows.length === 0 ? (
          <Empty msg="尚未建立採購來源，按上方「+ 新增採購來源」開始。" />
        ) : (
          <List>
            <Header cols="sm:grid-cols-[1fr_120px_1fr_70px]">
              <span>網站名稱</span>
              <span>簡碼</span>
              <span>註記</span>
              <span></span>
            </Header>
            {sourceRows.map((s) => (
              <Row key={s.id} action={updateSourceCodeAction} cols="sm:grid-cols-[1fr_120px_1fr_70px]">
                <input type="hidden" name="id" value={s.id} />
                <span className="text-sm">{s.name}</span>
                <input name="code" defaultValue={s.code ?? ''} maxLength={6} placeholder="NSW" className={codeCls} />
                <input name="notes" defaultValue={s.notes ?? ''} placeholder="例：日本西部代購" className={inputCls} />
                <SaveBtn />
              </Row>
            ))}
          </List>
        )}
      </Section>

      {/* 2. 商品分類 */}
      <Section
        title="商品分類"
        description="商品分類 + 單字母代碼（用於 SKU 第三段，例：A=上衣、B=褲子）。"
      >
        <Row action={createCategoryAction} cols="sm:grid-cols-[1fr_80px_1fr_70px]" creating>
          <input name="name" required placeholder="例：上衣" className={inputCls} />
          <input name="code" maxLength={2} placeholder="A" className={codeCls} />
          <input name="notes" placeholder="備註（選填）" className={inputCls} />
          <CreateBtn />
        </Row>

        {categoryRows.length > 0 && (
          <List>
            <Header cols="sm:grid-cols-[1fr_80px_1fr_120px]">
              <span>分類名稱</span>
              <span>代碼</span>
              <span>註記</span>
              <span></span>
            </Header>
            {categoryRows.map((c) => (
              <Row key={c.id} action={updateCategoryCodeAction} cols="sm:grid-cols-[1fr_80px_1fr_120px]">
                <input type="hidden" name="id" value={c.id} />
                <input name="name" defaultValue={c.name} className={inputCls} />
                <input name="code" defaultValue={c.code ?? ''} maxLength={2} placeholder="A" className={codeCls} />
                <input name="notes" defaultValue={c.notes ?? ''} placeholder="例：所有上衣商品" className={inputCls} />
                <SaveDeletePair deleteAction={deleteCategoryAction} id={c.id} />
              </Row>
            ))}
          </List>
        )}
      </Section>

      {/* 3. 稅率分組 */}
      <Section
        title="進口稅率分組"
        description="按商品種類設定關稅率。建議參考海關稅則：嬰兒服飾 ~12%、紗布巾 ~7.5%、玩具 0%、奶瓶 0–5%。"
      >
        <Row action={createTaxRateGroupAction} cols="sm:grid-cols-[1fr_140px_1fr_70px]" creating>
          <input name="name" required placeholder="例：嬰兒服飾" className={inputCls} />
          <input name="importDutyRateBp" type="number" min={0} max={10000} required placeholder="1200 = 12%" className={numCls} />
          <input name="notes" placeholder="備註（選填）" className={inputCls} />
          <CreateBtn />
        </Row>

        {taxRows.length > 0 && (
          <List>
            <Header cols="sm:grid-cols-[1fr_140px_1fr_120px]">
              <span>名稱</span>
              <span>稅率（× 100 = %）</span>
              <span>備註</span>
              <span></span>
            </Header>
            {taxRows.map((t) => (
              <div key={t.id} className="border-t border-line">
                <Row action={updateTaxRateGroupAction} cols="sm:grid-cols-[1fr_140px_1fr_120px]">
                  <input type="hidden" name="id" value={t.id} />
                  <input name="name" defaultValue={t.name} className={inputCls} />
                  <div>
                    <input name="importDutyRateBp" type="number" min={0} max={10000} defaultValue={t.importDutyRateBp} className={numCls} />
                    <p className="text-[10px] text-ink-soft mt-0.5 text-right">
                      = {(t.importDutyRateBp / 100).toFixed(2)}%
                    </p>
                  </div>
                  <input name="notes" defaultValue={t.notes ?? ''} className={inputCls} />
                  <SaveDeletePair deleteAction={deleteTaxRateGroupAction} id={t.id} />
                </Row>
              </div>
            ))}
          </List>
        )}
      </Section>

      {/* 4. 報關方案 */}
      <Section
        title="報關雜支方案"
        description="每張進貨單會選一個方案，金額會依進貨單總件數平均分攤到每個商品。"
      >
        <Row action={createClearanceFeePlanAction} cols="sm:grid-cols-[1fr_120px_1fr_70px]" creating>
          <input name="name" required placeholder="例：A 方案" className={inputCls} />
          <input name="amountTwd" type="number" min={0} required placeholder="200 (NT$)" className={numCls} />
          <input name="notes" placeholder="備註（選填）" className={inputCls} />
          <CreateBtn />
        </Row>

        {clearRows.length > 0 && (
          <List>
            <Header cols="sm:grid-cols-[1fr_120px_1fr_120px]">
              <span>名稱</span>
              <span>金額（NT$）</span>
              <span>備註</span>
              <span></span>
            </Header>
            {clearRows.map((p) => (
              <div key={p.id} className="border-t border-line">
                <Row action={updateClearanceFeePlanAction} cols="sm:grid-cols-[1fr_120px_1fr_120px]">
                  <input type="hidden" name="id" value={p.id} />
                  <input name="name" defaultValue={p.name} className={inputCls} />
                  <input name="amountTwd" type="number" min={0} defaultValue={p.amountTwd} className={numCls} />
                  <input name="notes" defaultValue={p.notes ?? ''} className={inputCls} />
                  <SaveDeletePair deleteAction={deleteClearanceFeePlanAction} id={p.id} />
                </Row>
              </div>
            ))}
          </List>
        )}
      </Section>

      {/* 5. 代購方案 */}
      <Section
        title="代購公司方案"
        description="基本方案費 + 手續費。每張進貨單選一個方案，總額分攤到每個商品。"
      >
        <Row action={createAgentPlanAction} cols="sm:grid-cols-[1fr_110px_110px_1fr_70px]" creating>
          <input name="name" required placeholder="例：集運 A" className={inputCls} />
          <input name="baseFeeTwd" type="number" min={0} placeholder="基本 500" className={numCls} />
          <input name="handlingFeeTwd" type="number" min={0} placeholder="手續 500" className={numCls} />
          <input name="notes" placeholder="備註（選填）" className={inputCls} />
          <CreateBtn />
        </Row>

        {agentRows.length > 0 && (
          <List>
            <Header cols="sm:grid-cols-[1fr_110px_110px_1fr_120px]">
              <span>名稱</span>
              <span>基本費</span>
              <span>手續費</span>
              <span>備註</span>
              <span></span>
            </Header>
            {agentRows.map((p) => (
              <div key={p.id} className="border-t border-line">
                <Row action={updateAgentPlanAction} cols="sm:grid-cols-[1fr_110px_110px_1fr_120px]">
                  <input type="hidden" name="id" value={p.id} />
                  <input name="name" defaultValue={p.name} className={inputCls} />
                  <input name="baseFeeTwd" type="number" min={0} defaultValue={p.baseFeeTwd} className={numCls} />
                  <input name="handlingFeeTwd" type="number" min={0} defaultValue={p.handlingFeeTwd} className={numCls} />
                  <input name="notes" defaultValue={p.notes ?? ''} className={inputCls} />
                  <SaveDeletePair deleteAction={deleteAgentPlanAction} id={p.id} />
                </Row>
              </div>
            ))}
          </List>
        )}
      </Section>

      {/* 6. 付款方式 */}
      <Section
        title="付款方式"
        description="進貨單付款方式下拉選項。例：信用卡（台新）、信用卡（玉山）、現金、銀行匯款。"
      >
        <Row action={createPaymentMethodAction} cols="sm:grid-cols-[1fr_1fr_70px]" creating>
          <input name="name" required placeholder="例：信用卡（台新）" className={inputCls} />
          <input name="notes" placeholder="備註（選填）" className={inputCls} />
          <CreateBtn />
        </Row>

        {payRows.length > 0 && (
          <List>
            <Header cols="sm:grid-cols-[1fr_1fr_120px]">
              <span>名稱</span>
              <span>備註</span>
              <span></span>
            </Header>
            {payRows.map((p) => (
              <div key={p.id} className="border-t border-line">
                <Row action={updatePaymentMethodAction} cols="sm:grid-cols-[1fr_1fr_120px]">
                  <input type="hidden" name="id" value={p.id} />
                  <input name="name" defaultValue={p.name} className={inputCls} />
                  <input name="notes" defaultValue={p.notes ?? ''} className={inputCls} />
                  <SaveDeletePair deleteAction={deletePaymentMethodAction} id={p.id} />
                </Row>
              </div>
            ))}
          </List>
        )}
      </Section>
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="font-serif text-lg mb-1">{title}</h2>
      <p className="text-ink-soft text-sm mb-4">{description}</p>
      {children}
    </section>
  )
}

function Empty({ msg }: { msg: string }) {
  return <p className="text-ink-soft text-sm py-4">{msg}</p>
}

function List({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-line rounded-lg overflow-x-auto">
      {children}
    </div>
  )
}

function Header({
  cols,
  children,
}: {
  cols: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`hidden sm:grid ${cols.replace(/^sm:/, '')} gap-2 px-3 py-2 bg-cream-50 text-xs text-ink-soft uppercase tracking-wider items-center`}
    >
      {children}
    </div>
  )
}

function Row({
  action,
  cols,
  creating,
  children,
}: {
  action: (formData: FormData) => Promise<void>
  cols: string
  creating?: boolean
  children: React.ReactNode
}) {
  return (
    <form
      action={action}
      className={`grid grid-cols-1 ${cols} gap-2 ${creating ? 'bg-cream-50/50 border border-line rounded p-3 mb-3' : 'px-3 py-3 sm:py-2 border-t border-line first:border-t-0'} sm:items-start`}
    >
      {children}
    </form>
  )
}

function SaveBtn() {
  return (
    <button
      type="submit"
      className="bg-ink text-cream rounded text-xs px-2 py-1 hover:bg-accent"
    >
      儲存
    </button>
  )
}

function CreateBtn() {
  return (
    <button
      type="submit"
      className="bg-ink text-cream rounded text-sm px-3 py-1 hover:bg-accent"
    >
      + 新增
    </button>
  )
}

function SaveDeletePair({
  deleteAction,
  id,
}: {
  deleteAction: (formData: FormData) => Promise<void>
  id: string
}) {
  return (
    <div className="flex gap-2 items-center">
      <button
        type="submit"
        className="text-xs text-accent hover:underline"
      >
        儲存
      </button>
      <button
        type="submit"
        formAction={deleteAction}
        formNoValidate
        className="text-xs text-danger hover:underline"
      >
        刪除
      </button>
    </div>
  )
}
