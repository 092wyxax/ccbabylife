'use client'

import { useActionState, useState } from 'react'
import type { Product, Brand, Category } from '@/db/schema'
import type { ProductFormState } from '@/server/actions/products'
import { imageUrl } from '@/lib/image'

export type ProductFormDefaults = Partial<
  Pick<
    Product,
    | 'slug'
    | 'nameZh'
    | 'nameJp'
    | 'brandId'
    | 'categoryId'
    | 'description'
    | 'minAgeMonths'
    | 'maxAgeMonths'
    | 'priceJpy'
    | 'priceTwd'
    | 'costJpy'
    | 'weightG'
    | 'stockType'
    | 'stockQuantity'
    | 'status'
    | 'sourceUrl'
    | 'legalCheckPassed'
    | 'legalChineseLabel'
    | 'legalCategory'
    | 'legalShopPromise'
    | 'legalShopLimits'
    | 'legalReturnNote'
    | 'trialDay1'
    | 'trialDay7'
    | 'trialDay14'
    | 'trialPros'
    | 'trialCons'
    | 'trialRating'
    | 'notSuitableFor'
    | 'bsmiCode'
    | 'sgsReportNo'
  >
>

interface Props {
  mode: 'create' | 'edit'
  brands: Brand[]
  categories: Category[]
  product?: Product
  defaults?: ProductFormDefaults
  imageUrls?: string[]
  action: (prevState: ProductFormState, formData: FormData) => Promise<ProductFormState>
}

const initialState: ProductFormState = {}

export function ProductForm({
  mode,
  brands,
  categories,
  product,
  defaults,
  imageUrls,
  action,
}: Props) {
  // For edit mode use product values; for create mode allow optional defaults
  // (e.g. AI-prefilled values from a Japanese URL).
  const initial: ProductFormDefaults = product ?? defaults ?? {}
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
        <Field
          label="中文品名"
          name="nameZh"
          required
          defaultValue={initial.nameZh}
          error={errs.nameZh}
        />
        <Field label="日文品名" name="nameJp" defaultValue={initial.nameJp ?? ''} error={errs.nameJp} />
        <Field
          label="網址 slug"
          name="slug"
          required
          defaultValue={initial.slug}
          hint="只能用小寫英數與短橫線，例如 pigeon-gauze-towel-30"
          error={errs.slug}
        />
        <Row>
          <Select
            label="品牌"
            name="brandId"
            defaultValue={initial.brandId ?? ''}
            options={[
              { value: '', label: '— 不指定 —' },
              ...brands.map((b) => ({ value: b.id, label: b.nameZh })),
            ]}
            error={errs.brandId}
          />
          <Select
            label="分類"
            name="categoryId"
            defaultValue={initial.categoryId ?? ''}
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
            label="日幣售價"
            name="priceJpy"
            type="number"
            required
            min={0}
            defaultValue={initial.priceJpy?.toString()}
            error={errs.priceJpy}
          />
          <Field
            label="日幣成本"
            name="costJpy"
            type="number"
            min={0}
            defaultValue={initial.costJpy?.toString() ?? ''}
            error={errs.costJpy}
          />
        </Row>
        <Row>
          <Field
            label="台幣售價"
            name="priceTwd"
            type="number"
            required
            min={0}
            defaultValue={initial.priceTwd?.toString()}
            hint="目前手動輸入，Phase 1c 後會以 PRICING_FORMULA.md 自動計算"
            error={errs.priceTwd}
          />
          <Field
            label="重量 (g)"
            name="weightG"
            type="number"
            required
            min={1}
            defaultValue={initial.weightG?.toString()}
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
            defaultValue={initial.minAgeMonths?.toString() ?? ''}
            hint="僅母嬰商品需要；寵物用品 / 一般商品請留空"
            error={errs.minAgeMonths}
          />
          <Field
            label="最大月齡"
            name="maxAgeMonths"
            type="number"
            defaultValue={initial.maxAgeMonths?.toString() ?? ''}
            hint="僅母嬰商品需要；寵物用品 / 一般商品請留空"
            error={errs.maxAgeMonths}
          />
        </Row>
        <Row>
          <Select
            label="商品類型"
            name="stockType"
            required
            defaultValue={initial.stockType ?? 'preorder'}
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
            defaultValue={initial.stockQuantity?.toString() ?? '0'}
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
          defaultValue={initial.description ?? ''}
          error={errs.description}
        />
      </Section>

      <Section title="14 天試用筆記（差異化武器）">
        <p className="text-xs text-ink-soft -mt-2">
          PLAYBOOK 核心：誠實寫日記式試用 + Pros/Cons + 評分。轉換率提升 30-50%、退貨率降 15%。
        </p>
        <Textarea
          label="Day 1 第一次使用印象"
          name="trialDay1"
          rows={3}
          defaultValue={initial.trialDay1 ?? ''}
          hint="約 200 字，描述開箱 + 第一印象。"
        />
        <Textarea
          label="Day 7 一週後的觀察"
          name="trialDay7"
          rows={3}
          defaultValue={initial.trialDay7 ?? ''}
        />
        <Textarea
          label="Day 14 兩週後的結論"
          name="trialDay14"
          rows={3}
          defaultValue={initial.trialDay14 ?? ''}
        />
        <Row>
          <Textarea
            label="優點 Pros（一行一項，建議 3 點）"
            name="trialPros"
            rows={3}
            defaultValue={(initial.trialPros ?? []).join('\n')}
            hint="例：洗 50 次仍不變形"
          />
          <Textarea
            label="缺點 Cons（一行一項，建議 3 點）"
            name="trialCons"
            rows={3}
            defaultValue={(initial.trialCons ?? []).join('\n')}
            hint="誠實寫，反而提升信任。"
          />
        </Row>
        <Field
          label="評分（0.0–5.0，可空白）"
          name="trialRating"
          type="number"
          defaultValue={
            initial.trialRating != null
              ? (initial.trialRating / 10).toFixed(1)
              : ''
          }
          hint="例：4.0 / 3.5。0.1 為一階。"
        />
      </Section>

      <Section title="不適合誰用（反向清單）">
        <Textarea
          label="一行一項"
          name="notSuitableFor"
          rows={4}
          defaultValue={(initial.notSuitableFor ?? []).join('\n')}
          hint={
            '例：\n寶寶超過 18 個月（建議改買 OOO）\n預算低於 NT$500\n急用（預購 14 天到，急用買台灣現貨）'
          }
        />
      </Section>

      <Section title="商品圖片">
        <ImagesField existingImages={imageUrls ?? []} />
      </Section>

      <Section title="法規檢核（重要）">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="legalCheckPassed"
            defaultChecked={initial.legalCheckPassed ?? false}
            className="mt-1"
          />
          <span className="text-sm">
            <span className="font-medium">已對照 HANDBOOK §4 法規地雷，確認非紅燈品項，可上架販售。</span>
            <span className="block text-ink-soft text-xs mt-0.5">
              紅燈品項一律不上架。狀態設為「上架中」必須勾此選項。
            </span>
          </span>
        </label>
        <Textarea
          label="中文標示說明"
          name="legalChineseLabel"
          rows={3}
          defaultValue={initial.legalChineseLabel ?? ''}
          hint="成分 / 淨重 / 製造商 / 進口商 / 效期。建議搭配實拍照片放在商品圖中。"
        />
        <Field
          label="法規分類"
          name="legalCategory"
          defaultValue={initial.legalCategory ?? ''}
          hint="例：非應施檢驗品 / 應施檢驗 / 食藥署備查"
        />
        <Row>
          <Field
            label="BSMI 字號（如有）"
            name="bsmiCode"
            defaultValue={initial.bsmiCode ?? ''}
            hint="例：R12345（會在商品頁顯示連結到標檢局查詢）"
          />
          <Field
            label="SGS / TFDA 報告編號（如有）"
            name="sgsReportNo"
            defaultValue={initial.sgsReportNo ?? ''}
            hint="第三方檢驗報告編號"
          />
        </Row>
        <Textarea
          label="我們做了什麼"
          name="legalShopPromise"
          rows={2}
          defaultValue={initial.legalShopPromise ?? ''}
          hint="例：✓ 中文標示完整、✓ 原廠來源、✓ 有效期 6 個月以上"
        />
        <Textarea
          label="我們做不到什麼（誠實揭露）"
          name="legalShopLimits"
          rows={2}
          defaultValue={initial.legalShopLimits ?? ''}
          hint="例：✗ 原廠保固（非台灣公司貨）"
        />
        <Textarea
          label="退換貨說明"
          name="legalReturnNote"
          rows={2}
          defaultValue={initial.legalReturnNote ?? ''}
          hint="例：本品為日本平行輸入，售後不適用原廠保固，但本店提供 6 個月換新承諾。"
        />
        <Field
          label="日本來源 URL"
          name="sourceUrl"
          type="url"
          defaultValue={initial.sourceUrl ?? ''}
          error={errs.sourceUrl}
        />
      </Section>

      <Section title="上架狀態">
        <Select
          label="狀態"
          name="status"
          required
          defaultValue={initial.status ?? 'draft'}
          options={[
            { value: 'draft', label: '草稿（不對外）' },
            { value: 'active', label: '上架中（前台可見）' },
            { value: 'archived', label: '已封存' },
          ]}
          error={errs.status}
          hint="改成「上架中」必須先勾上方法規檢核。建立後預設為草稿，前台不會顯示，請記得改為上架中。"
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

function ImagesField({ existingImages }: { existingImages: string[] }) {
  const [kept, setKept] = useState<string[]>(existingImages)
  const [newPreviews, setNewPreviews] = useState<Array<{ name: string; url: string }>>([])

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const previews = Array.from(files).map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
    }))
    setNewPreviews((prev) => [...prev, ...previews])
  }

  return (
    <div className="space-y-4">
      {kept.length > 0 && (
        <div>
          <p className="text-sm mb-2">目前圖片（順序即顯示順序，第一張為主圖）</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {kept.map((path, idx) => (
              <div key={path} className="relative group">
                <input type="hidden" name="keepImagePath" value={path} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl(path)}
                  alt=""
                  className="aspect-square w-full object-cover rounded-md border border-line bg-cream-100"
                />
                {idx === 0 && (
                  <span className="absolute top-1 left-1 bg-ink text-cream text-[10px] px-1.5 py-0.5 rounded">
                    主圖
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setKept((prev) => prev.filter((p) => p !== path))}
                  className="absolute top-1 right-1 bg-danger/90 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  移除
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="newImageFiles" className="block text-sm mb-2">
          {kept.length > 0 ? '新增圖片（會附加到現有圖片後）' : '上傳商品圖片'}
        </label>
        <input
          id="newImageFiles"
          name="newImageFiles"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="block w-full text-sm text-ink-soft file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-ink file:text-cream hover:file:bg-accent file:cursor-pointer cursor-pointer"
        />
        <p className="text-xs text-ink-soft mt-1">
          支援 jpg / png / webp / gif，每張 5MB 以內。可一次選多張。
        </p>
      </div>

      {newPreviews.length > 0 && (
        <div>
          <p className="text-sm mb-2">即將上傳的圖片（送出後才真正儲存）</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {newPreviews.map((p) => (
              <div key={p.url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.name}
                  className="aspect-square w-full object-cover rounded-md border border-accent/40"
                />
                <span className="absolute top-1 left-1 bg-accent text-cream text-[10px] px-1.5 py-0.5 rounded">
                  新
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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
  required?: boolean
  min?: number
}

function Field({ label, name, type = 'text', defaultValue, hint, error, required, min }: FieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm mb-1.5">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        min={min}
        className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink invalid:border-danger/40"
      />
      {hint && !error && <p className="text-xs text-ink-soft mt-1">{hint}</p>}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  )
}

function Textarea({
  label,
  name,
  rows = 3,
  defaultValue,
  hint,
  error,
  required,
}: FieldProps & { rows?: number }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm mb-1.5">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        required={required}
        className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink leading-relaxed invalid:border-danger/40"
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
  required,
}: {
  label: string
  name: string
  defaultValue?: string
  options: Array<{ value: string; label: string }>
  hint?: string
  error?: string
  required?: boolean
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm mb-1.5">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        required={required}
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
