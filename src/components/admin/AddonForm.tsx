'use client'

import { useActionState, useState } from 'react'
import type { PromoState } from '@/server/actions/promotions'

const initial: PromoState = {}

interface ProductOpt {
  id: string
  name: string
  priceTwd: number
}

interface Props {
  action: (prev: PromoState, formData: FormData) => Promise<PromoState>
  submitLabel: string
  products: ProductOpt[]
}

export function AddonForm({ action, submitLabel, products }: Props) {
  const [state, formAction, pending] = useActionState(action, initial)
  const [addonId, setAddonId] = useState('')
  const addonProduct = products.find((p) => p.id === addonId)

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="mainProductId" className="block text-sm mb-1.5">
          主商品 <span className="text-danger">*</span>
        </label>
        <select
          id="mainProductId"
          name="mainProductId"
          required
          className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
        >
          <option value="">請選擇⋯</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-ink-soft mt-1">客戶看主商品頁面時，下方會顯示加購選項</p>
      </div>

      <div>
        <label htmlFor="addonProductId" className="block text-sm mb-1.5">
          加購商品 <span className="text-danger">*</span>
        </label>
        <select
          id="addonProductId"
          name="addonProductId"
          required
          value={addonId}
          onChange={(e) => setAddonId(e.target.value)}
          className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
        >
          <option value="">請選擇⋯</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}（原價 NT${p.priceTwd.toLocaleString()}）
            </option>
          ))}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="addonPriceTwd" className="block text-sm mb-1.5">
            加購價 (NTD) <span className="text-danger">*</span>
          </label>
          <input
            id="addonPriceTwd"
            name="addonPriceTwd"
            type="number"
            required
            placeholder={addonProduct ? `原價 ${addonProduct.priceTwd}` : '例：99'}
            className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
          />
          {addonProduct && (
            <p className="text-xs text-ink-soft mt-1">
              原價 NT${addonProduct.priceTwd.toLocaleString()}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="maxAddonQty" className="block text-sm mb-1.5">
            最多加購數量
          </label>
          <input
            id="maxAddonQty"
            name="maxAddonQty"
            type="number"
            defaultValue="1"
            min="1"
            className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked className="w-4 h-4" />
        啟用此加購
      </label>

      <button
        type="submit"
        disabled={pending}
        className="font-jp bg-ink text-cream px-6 py-2.5 rounded-md hover:bg-accent transition-colors disabled:opacity-50 tracking-wider"
      >
        {pending ? '儲存中⋯' : submitLabel}
      </button>
    </form>
  )
}
