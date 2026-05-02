'use client'

import { useActionState } from 'react'
import {
  importProductsCsvAction,
  type ImportState,
} from '@/server/actions/products-import'

const initial: ImportState = {}

export function CsvImportForm() {
  const [state, formAction, pending] = useActionState(importProductsCsvAction, initial)

  const success = state.results?.filter((r) => r.status !== 'error').length ?? 0
  const errors = state.results?.filter((r) => r.status === 'error').length ?? 0

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="csv" className="block text-sm mb-1.5">
            選擇 CSV 檔
          </label>
          <input
            id="csv"
            name="csv"
            type="file"
            accept=".csv,text/csv"
            required
            className="block w-full text-sm text-ink-soft file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-ink file:text-cream hover:file:bg-accent file:cursor-pointer cursor-pointer"
          />
          <p className="text-xs text-ink-soft mt-2">
            必填欄位：slug, nameZh, priceJpy, priceTwd, weightG, stockType
            （選填：nameJp, brand, category, description, useExperience, minAgeMonths,
            maxAgeMonths, costJpy, stockQuantity, status, legalCheckPassed, legalNotes）
          </p>
          <p className="text-xs text-ink-soft mt-1">
            slug 已存在的會更新，沒存在的會新建。
          </p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="bg-ink text-cream px-5 py-2 rounded-md text-sm hover:bg-accent disabled:opacity-50"
        >
          {pending ? '處理中⋯' : '開始匯入'}
        </button>
      </form>

      {state.error && (
        <div className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
          {state.error}
        </div>
      )}

      {state.results && (
        <div>
          <p className="text-sm mb-3">
            共 {state.total} 筆 · ✓ 成功 {success} · ✗ 失敗 {errors}
          </p>
          <div className="bg-white border border-line rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 text-ink-soft">
                <tr>
                  <th className="text-left px-3 py-2 font-normal w-12">行</th>
                  <th className="text-left px-3 py-2 font-normal">slug</th>
                  <th className="text-left px-3 py-2 font-normal w-24">狀態</th>
                  <th className="text-left px-3 py-2 font-normal">訊息</th>
                </tr>
              </thead>
              <tbody>
                {state.results.map((r) => (
                  <tr key={r.rowIndex} className="border-t border-line">
                    <td className="px-3 py-2 text-ink-soft">{r.rowIndex}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.slug}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          'text-xs px-2 py-0.5 rounded-full ' +
                          (r.status === 'created'
                            ? 'bg-success/15 text-ink'
                            : r.status === 'updated'
                            ? 'bg-line text-ink'
                            : r.status === 'skipped'
                            ? 'bg-ink/10 text-ink-soft'
                            : 'bg-danger/15 text-danger')
                        }
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-ink-soft">{r.message ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
