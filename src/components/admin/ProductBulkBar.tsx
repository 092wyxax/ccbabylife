'use client'

import { useState, useTransition } from 'react'
import {
  bulkUpdateProductStatusAction,
  type BulkActionState,
} from '@/server/actions/products-bulk'
import type { Product } from '@/db/schema'

interface Props {
  productIds: string[]
}

export function ProductBulkBar({ productIds }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [feedback, setFeedback] = useState<BulkActionState>({})
  const [pending, startTransition] = useTransition()

  // Subscribe to checkbox changes
  if (typeof document !== 'undefined') {
    document.querySelectorAll<HTMLInputElement>('input[name="bulk-product-id"]').forEach((cb) => {
      cb.onchange = () => {
        setSelected((prev) => {
          const next = new Set(prev)
          if (cb.checked) next.add(cb.value)
          else next.delete(cb.value)
          return next
        })
      }
    })
  }

  const apply = (toStatus: Product['status']) => {
    if (selected.size === 0) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('toStatus', toStatus)
      for (const id of selected) fd.append('id', id)
      const result = await bulkUpdateProductStatusAction({}, fd)
      setFeedback(result)
      if (result.success) setSelected(new Set())
    })
  }

  const selectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelected(new Set(productIds))
      document
        .querySelectorAll<HTMLInputElement>('input[name="bulk-product-id"]')
        .forEach((cb) => (cb.checked = true))
    } else {
      setSelected(new Set())
      document
        .querySelectorAll<HTMLInputElement>('input[name="bulk-product-id"]')
        .forEach((cb) => (cb.checked = false))
    }
  }

  return (
    <div className="bg-white border border-line rounded-lg p-3 mb-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
      <label className="flex items-center gap-2 text-xs text-ink-soft cursor-pointer">
        <input
          type="checkbox"
          onChange={selectAll}
          checked={selected.size === productIds.length && productIds.length > 0}
        />
        全選
      </label>
      <span className="text-sm">
        已選 <strong>{selected.size}</strong> / {productIds.length}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          disabled={selected.size === 0 || pending}
          onClick={() => apply('active')}
          className="text-xs bg-success/15 hover:bg-success hover:text-white px-3 py-1.5 rounded-md disabled:opacity-50 transition-colors"
        >
          批次上架
        </button>
        <button
          type="button"
          disabled={selected.size === 0 || pending}
          onClick={() => apply('draft')}
          className="text-xs bg-line hover:bg-ink hover:text-cream px-3 py-1.5 rounded-md disabled:opacity-50 transition-colors"
        >
          批次轉草稿
        </button>
        <button
          type="button"
          disabled={selected.size === 0 || pending}
          onClick={() => apply('archived')}
          className="text-xs bg-ink/10 hover:bg-ink hover:text-cream px-3 py-1.5 rounded-md disabled:opacity-50 transition-colors"
        >
          批次封存
        </button>
        {feedback.error && (
          <span className="text-xs text-danger">{feedback.error}</span>
        )}
        {feedback.success && (
          <span className="text-xs text-success">{feedback.success}</span>
        )}
      </div>
    </div>
  )
}
