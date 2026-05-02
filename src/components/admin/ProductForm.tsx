'use client'

import { useActionState } from 'react'
import type { Product, Brand, Category } from '@/db/schema'
import type { ProductFormState } from '@/server/actions/products'

interface Props {
  mode: 'create' | 'edit'
  brands: Brand[]
  categories: Category[]
  product?: Product
  imageUrls?: string[]
  action: (prevState: ProductFormState, formData: FormData) => Promise<ProductFormState>
}

const initialState: ProductFormState = {}

export function ProductForm({ mode, brands, categories, product, imageUrls, action }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const errs = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="space-y-8 max-w-3xl">
      {state.error && (
        <div className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
          {state.error}
        </div>
      )}

      <Section title="基本資訊">
        <Field label="中文品名 *" name="nameZh" defaultValue={product?.nameZh} error={errs.nameZh} />
        <Field label="日文品名" name="nameJp" defaultValue={product?.nameJp ?? ''} error={errs.nameJp} />
        <Field
          label="網址 slug *"
          name="slug"
          defaultValue={product?.slug}
          hint="只能用小寫英數與短橫線，例如 pigeon-gauze-towel-30"
          error={errs.slug}
        />
        <Row>
          <Select
            label="品牌"
            name="brandId"
            defaultValue={product?.brandId ?? ''}
            options={[
              { value: '', label: '— 不指定 —' },
              ...brands.map((b) => ({ value: b.id, label: b.nameZh })),
            ]}
            error={errs.brandId}
          />
          <Select
            label="分類"
            name="categoryId"
            defaultValue={product?.categoryId ?? ''}
            options={[
              { value: '', label: '— 不指定 —' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            error={errs.categoryId}
          />
        </Row>
      </Section>

      <Section title="價格與重量">
        <Row>
          <Field
            label="日幣售價 *"
            name="priceJpy"
            type="number"
            defaultValue={product?.priceJpy?.toString()}
            error={errs.priceJpy}
          />
          <Field
            label="日幣成本"
            name="costJpy"
            type="number"
            defaultValue={product?.costJpy?.toString() ?? ''}
            error={errs.costJpy}
          />
        </Row>
        <Row>
          <Field
            label="台幣售價 *"
            name="priceTwd"
            type="number"
            defaultValue={product?.priceTwd?.toString()}
            hint="目前手動輸入，Phase 1c 後會以 PRICING_FORMULA.md 自動計算"
            error={errs.priceTwd}
          />
          <Field
            label="重量 (g) *"
            name="weightG"
            type="number"
            defaultValue={product?.weightG?.toString()}
            error={errs.weightG}
          />
        </Row>
      </Section>

      <Section title="適用對象與庫存">
        <Row>
          <Field
            label="最小月齡"
            name="minAgeMonths"
            type="number"
            defaultValue={product?.minAgeMonths?.toString() ?? ''}
            hint="僅母嬰商品需要；寵物用品 / 一般商品請留空"
            error={errs.minAgeMonths}
          />
          <Field
            label="最大月齡"
            name="maxAgeMonths"
            type="number"
            defaultValue={product?.maxAgeMonths?.toString() ?? ''}
            hint="僅母嬰商品需要；寵物用品 / 一般商品請留空"
            error={errs.maxAgeMonths}
          />
        </Row>
        <Row>
          <Select
            label="商品類型 *"
            name="stockType"
            defaultValue={product?.stockType ?? 'preorder'}
            options={[
              { value: 'preorder', label: '預購' },
              { value: 'in_stock', label: '現貨' },
            ]}
            error={errs.stockType}
          />
          <Field
            label="庫存數量"
            name="stockQuantity"
            type="number"
            defaultValue={product?.stockQuantity?.toString() ?? '0'}
            hint="預購商品可填 0"
            error={errs.stockQuantity}
          />
        </Row>
      </Section>

      <Section title="商品說明">
        <Textarea
          label="商品說明"
          name="description"
          rows={4}
          defaultValue={product?.description ?? ''}
          error={errs.description}
        />
        <Textarea
          label="使用心得"
          name="useExperience"
          rows={5}
          defaultValue={product?.useExperience ?? ''}
          hint="差異化武器：誠實寫缺點 + 適合誰 + 不適合誰。母嬰商品建議以娃媽角度撰寫；寵物 / 一般商品以實際使用者角度。"
          error={errs.useExperience}
        />
      </Section>

      <Section title="商品圖片">
        <Textarea
          label="圖片 URL（每行一張，第一張為主圖）"
          name="imageUrls"
          rows={4}
          defaultValue={imageUrls?.join('\n') ?? ''}
          hint="一行一張 URL；第一張顯示在商品卡與詳情頁主圖。Phase 1a Week 3 會接 Cloudflare Images 上傳。"
          error={errs.imageUrls}
        />
      </Section>

      <Section title="法規檢核（重要）">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="legalCheckPassed"
            defaultChecked={product?.legalCheckPassed ?? false}
            className="mt-1"
          />
          <span className="text-sm">
            <span className="font-medium">已對照 docs/LEGAL_GUIDE.md，確認非紅燈品項，可上架販售。</span>
            <span className="block text-ink-soft text-xs mt-0.5">
              紅燈品項一律不上架。狀態設為「上架中」必須勾此選項。
            </span>
          </span>
        </label>
        <Field
          label="法規備註"
          name="legalNotes"
          defaultValue={product?.legalNotes ?? ''}
          hint="例：純棉、無染料、無 BSMI 必要"
          error={errs.legalNotes}
        />
        <Field
          label="日本來源 URL"
          name="sourceUrl"
          type="url"
          defaultValue={product?.sourceUrl ?? ''}
          error={errs.sourceUrl}
        />
      </Section>

      <Section title="上架狀態">
        <Select
          label="狀態 *"
          name="status"
          defaultValue={product?.status ?? 'draft'}
          options={[
            { value: 'draft', label: '草稿（不對外）' },
            { value: 'active', label: '上架中（前台可見）' },
            { value: 'archived', label: '已封存' },
          ]}
          error={errs.status}
          hint="改成「上架中」必須先勾上方法規檢核。"
        />
      </Section>

      <div className="flex gap-3 pt-4 border-t border-line">
        <button
          type="submit"
          disabled={pending}
          className="bg-ink text-cream px-6 py-2.5 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
        >
          {pending ? '儲存中⋯' : mode === 'create' ? '建立商品' : '儲存變更'}
        </button>
      </div>
    </form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>
}

interface FieldProps {
  label: string
  name: string
  type?: string
  defaultValue?: string
  hint?: string
  error?: string
}

function Field({ label, name, type = 'text', defaultValue, hint, error }: FieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm mb-1.5">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
      />
      {hint && !error && <p className="text-xs text-ink-soft mt-1">{hint}</p>}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  )
}

function Textarea({ label, name, rows = 3, defaultValue, hint, error }: FieldProps & { rows?: number }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm mb-1.5">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink leading-relaxed"
      />
      {hint && !error && <p className="text-xs text-ink-soft mt-1">{hint}</p>}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  )
}

function Select({
  label,
  name,
  defaultValue,
  options,
  hint,
  error,
}: {
  label: string
  name: string
  defaultValue?: string
  options: Array<{ value: string; label: string }>
  hint?: string
  error?: string
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm mb-1.5">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="w-full border border-line rounded-md px-3 py-2 bg-white focus:outline-none focus:border-ink"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error && <p className="text-xs text-ink-soft mt-1">{hint}</p>}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  )
}
