'use client'

import { useActionState } from 'react'
import {
  updateStoreSettingsAction,
  type SettingsState,
} from '@/server/actions/store-settings'

const initialState: SettingsState = {}

export function SettingsForm({
  botRate,
  freeShipThresholdTwd,
}: {
  botRate: number
  freeShipThresholdTwd: number
}) {
  const [state, formAction, pending] = useActionState(
    updateStoreSettingsAction,
    initialState
  )

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">
            台銀現金賣出匯率（JPY → TWD）
          </label>
          <input
            type="number"
            name="botRate"
            step="0.0001"
            min="0.1"
            max="0.5"
            required
            defaultValue={botRate}
            className="w-full border border-line rounded-md px-3 py-2 text-sm bg-white tabular-nums"
          />
          <p className="text-[11px] text-ink-soft mt-1 leading-relaxed">
            影響：報價計算機、AI 建檔的建議售價。系統匯率 = 此值 × 1.02（緩衝）。
            台銀牌告：
            <a
              href="https://rate.bot.com.tw/xrt?Lang=zh-TW"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-accent"
            >
              rate.bot.com.tw
            </a>
          </p>
        </div>

        <div>
          <label className="block text-xs text-ink-soft mb-1.5">
            滿額免運門檻（TWD）
          </label>
          <input
            type="number"
            name="freeShipThresholdTwd"
            step="50"
            min="0"
            max="100000"
            required
            defaultValue={freeShipThresholdTwd}
            className="w-full border border-line rounded-md px-3 py-2 text-sm bg-white tabular-nums"
          />
          <p className="text-[11px] text-ink-soft mt-1 leading-relaxed">
            影響：購物車免運進度條、結帳運費計算、訂閱定期購運費。
          </p>
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          ✓ {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="font-jp bg-ink text-cream px-6 py-2.5 rounded-md hover:bg-accent text-sm tracking-wider disabled:opacity-50"
      >
        {pending ? '儲存中⋯' : '儲存設定'}
      </button>
    </form>
  )
}
