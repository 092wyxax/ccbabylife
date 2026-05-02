'use client'

import { useActionState } from 'react'
import {
  addVariantAction,
  removeVariantFormAction,
  type VariantActionState,
} from '@/server/actions/product-variants'
import { formatTwd } from '@/lib/format'
import type { ProductVariant } from '@/db/schema'

const initial: VariantActionState = {}

interface Props {
  productId: string
  variants: ProductVariant[]
}

export function VariantsPanel({ productId, variants }: Props) {
  const [state, formAction, pending] = useActionState(
    async (prev: VariantActionState, fd: FormData) =>
      addVariantAction(productId, prev, fd),
    initial
  )

  return (
    <section>
      <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
        規格 / 變體（如尺寸、顏色）
      </h2>

      {variants.length > 0 ? (
        <div className="bg-white border border-line rounded-lg overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-ink-soft">
              <tr>
                <th className="text-left px-3 py-2 font-normal">SKU</th>
                <th className="text-left px-3 py-2 font-normal">規格</th>
                <th className="text-right px-3 py-2 font-normal">售價覆寫</th>
                <th className="text-right px-3 py-2 font-normal">庫存</th>
                <th className="text-right px-3 py-2 font-normal w-16"></th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id} className="border-t border-line">
                  <td className="px-3 py-2 font-mono text-xs">{v.sku}</td>
                  <td className="px-3 py-2">{v.name}</td>
                  <td className="px-3 py-2 text-right text-ink-soft">
                    {v.priceTwdOverride ? formatTwd(v.priceTwdOverride) : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">{v.stockQuantity}</td>
                  <td className="px-3 py-2 text-right">
                    <RemoveButton variantId={v.id} productId={productId} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-ink-soft mb-4">
          沒有額外規格 — 商品只有一種，無需設定。
        </p>
      )}

      <form
        action={formAction}
        className="bg-white border border-line rounded-lg p-3 grid grid-cols-2 sm:grid-cols-[1fr_2fr_120px_100px_80px] gap-2"
      >
        <input
          name="sku"
          required
          placeholder="SKU"
          className="border border-line rounded-md px-2 py-1 text-sm"
        />
        <input
          name="name"
          required
          placeholder="規格名稱（例如：80cm 粉色）"
          className="border border-line rounded-md px-2 py-1 text-sm"
        />
        <input
          name="priceTwdOverride"
          type="number"
          min={0}
          placeholder="售價覆寫"
          className="border border-line rounded-md px-2 py-1 text-sm"
        />
        <input
          name="stockQuantity"
          type="number"
          min={0}
          defaultValue={0}
          placeholder="庫存"
          className="border border-line rounded-md px-2 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-ink text-cream rounded-md text-sm hover:bg-accent disabled:opacity-50"
        >
          {pending ? '⋯' : '新增'}
        </button>
      </form>

      {state.error && <p className="text-xs text-danger mt-2">{state.error}</p>}
      {state.success && <p className="text-xs text-success mt-2">{state.success}</p>}
    </section>
  )
}

function RemoveButton({ variantId, productId }: { variantId: string; productId: string }) {
  return (
    <form action={removeVariantFormAction}>
      <input type="hidden" name="variantId" value={variantId} />
      <input type="hidden" name="productId" value={productId} />
      <button
        type="submit"
        className="text-xs text-ink-soft hover:text-danger underline"
      >
        移除
      </button>
    </form>
  )
}
