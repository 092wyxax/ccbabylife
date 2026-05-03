'use client'

import { useActionState, useState } from 'react'
import { useActionToast } from '@/hooks/useActionToast'
import {
  cancelOrderFormAction,
  refundOrderFormAction,
  type CancelOrderState,
  type RefundOrderState,
} from '@/server/actions/orders'
import { formatTwd } from '@/lib/format'

const initialCancel: CancelOrderState = {}
const initialRefund: RefundOrderState = {}

interface Props {
  orderId: string
  orderTotal: number
  canCancel: boolean
  canRefund: boolean
}

export function CancelRefundForms({
  orderId,
  orderTotal,
  canCancel,
  canRefund,
}: Props) {
  const [tab, setTab] = useState<'cancel' | 'refund' | null>(null)

  if (!canCancel && !canRefund) {
    return (
      <p className="text-xs text-ink-soft">
        當前狀態無法取消或退款
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {canCancel && (
          <button
            type="button"
            onClick={() => setTab(tab === 'cancel' ? null : 'cancel')}
            className={
              'font-jp text-xs px-3 py-1.5 rounded-md tracking-wider transition-colors ' +
              (tab === 'cancel'
                ? 'bg-ink text-cream'
                : 'bg-cream-100 hover:bg-line text-ink')
            }
          >
            キャンセル · 取消訂單
          </button>
        )}
        {canRefund && (
          <button
            type="button"
            onClick={() => setTab(tab === 'refund' ? null : 'refund')}
            className={
              'font-jp text-xs px-3 py-1.5 rounded-md tracking-wider transition-colors ' +
              (tab === 'refund'
                ? 'bg-ink text-cream'
                : 'bg-cream-100 hover:bg-line text-ink')
            }
          >
            返金 · 標記退款
          </button>
        )}
      </div>

      {tab === 'cancel' && <CancelForm orderId={orderId} />}
      {tab === 'refund' && <RefundForm orderId={orderId} orderTotal={orderTotal} />}
    </div>
  )
}

function CancelForm({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(
    cancelOrderFormAction,
    initialCancel
  )
  useActionToast(state)

  return (
    <form action={formAction} className="space-y-2 bg-cream-100 border border-line rounded-md p-3">
      <input type="hidden" name="orderId" value={orderId} />
      <label className="block text-xs text-ink-soft">取消原因</label>
      <textarea
        name="reason"
        required
        minLength={2}
        rows={2}
        placeholder="客人 24 小時內主動取消 / 重複下單 / 缺貨..."
        className="w-full text-xs border border-line rounded-md px-2 py-1.5 focus:outline-none focus:border-ink"
      />
      <button
        type="submit"
        disabled={pending}
        className="font-jp w-full bg-danger/15 hover:bg-danger hover:text-white text-ink text-xs py-2 rounded-md transition-colors disabled:opacity-50 tracking-wider"
      >
        {pending ? '・・・' : '確定取消訂單'}
      </button>
    </form>
  )
}

function RefundForm({
  orderId,
  orderTotal,
}: {
  orderId: string
  orderTotal: number
}) {
  const [state, formAction, pending] = useActionState(
    refundOrderFormAction,
    initialRefund
  )
  useActionToast(state)
  const [amount, setAmount] = useState(orderTotal)

  return (
    <form action={formAction} className="space-y-2 bg-cream-100 border border-line rounded-md p-3">
      <input type="hidden" name="orderId" value={orderId} />
      <div>
        <label className="block text-xs text-ink-soft mb-1">
          退款金額（最高 {formatTwd(orderTotal)}）
        </label>
        <input
          type="number"
          name="refundAmount"
          min={0}
          max={orderTotal}
          required
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full text-sm border border-line rounded-md px-2 py-1.5 focus:outline-none focus:border-ink"
        />
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={() => setAmount(orderTotal)}
            className="text-[10px] px-2 py-0.5 rounded-full border border-line hover:border-ink"
          >
            全額
          </button>
          <button
            type="button"
            onClick={() => setAmount(Math.round(orderTotal * 0.8))}
            className="text-[10px] px-2 py-0.5 rounded-full border border-line hover:border-ink"
          >
            80%
          </button>
          <button
            type="button"
            onClick={() => setAmount(Math.round(orderTotal * 0.5))}
            className="text-[10px] px-2 py-0.5 rounded-full border border-line hover:border-ink"
          >
            50%
          </button>
        </div>
      </div>
      <div>
        <label className="block text-xs text-ink-soft mb-1">退款原因</label>
        <textarea
          name="reason"
          required
          minLength={2}
          rows={2}
          placeholder="瑕疵品 / 商品延誤過久 / 客戶要求..."
          className="w-full text-xs border border-line rounded-md px-2 py-1.5 focus:outline-none focus:border-ink"
        />
      </div>
      <p className="text-[10px] text-ink-soft leading-snug">
        ⚠ 此動作只變更訂單狀態與紀錄。實際退款請至綠界後台或銀行操作。
      </p>
      <button
        type="submit"
        disabled={pending}
        className="font-jp w-full bg-warning/20 hover:bg-warning text-ink text-xs py-2 rounded-md transition-colors disabled:opacity-50 tracking-wider"
      >
        {pending ? '・・・' : '確定標記退款'}
      </button>
    </form>
  )
}
