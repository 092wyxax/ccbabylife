'use client'

import { useActionState, useState } from 'react'
import {
  createReturnRequestAction,
  type ReturnFormState,
} from '@/server/actions/returns'

const initial: ReturnFormState = {}

interface Item {
  id: string
  name: string
  quantity: number
  lineTotal: string
}

interface Props {
  orderId: string
  items: Item[]
}

export function ReturnRequestForm({ orderId, items }: Props) {
  const [state, formAction, pending] = useActionState(
    createReturnRequestAction,
    initial
  )
  const [type, setType] = useState<'return' | 'exchange'>('return')

  if (state.success && state.requestNumber) {
    return (
      <div className="bg-success/10 border border-success/40 rounded-lg p-6 text-center">
        <p className="text-success text-2xl mb-2">✓</p>
        <h2 className="font-serif text-xl mb-2">申請已送出</h2>
        <p className="text-sm text-ink-soft mb-1">{state.success}</p>
        <p className="text-xs text-ink-soft">
          申請編號：<span className="font-mono">{state.requestNumber}</span>
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="orderId" value={orderId} />

      <section>
        <h2 className="font-jp text-xs tracking-[0.2em] text-ink-soft mb-3">
          类型 · 申請類型
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <label
            className={
              'block text-center px-4 py-3 rounded-md border cursor-pointer transition-colors ' +
              (type === 'return'
                ? 'bg-ink text-cream border-ink'
                : 'bg-white border-line hover:border-ink/40')
            }
          >
            <input
              type="radio"
              name="type"
              value="return"
              checked={type === 'return'}
              onChange={() => setType('return')}
              className="sr-only"
            />
            退貨退款
          </label>
          <label
            className={
              'block text-center px-4 py-3 rounded-md border cursor-pointer transition-colors ' +
              (type === 'exchange'
                ? 'bg-ink text-cream border-ink'
                : 'bg-white border-line hover:border-ink/40')
            }
          >
            <input
              type="radio"
              name="type"
              value="exchange"
              checked={type === 'exchange'}
              onChange={() => setType('exchange')}
              className="sr-only"
            />
            換貨
          </label>
        </div>
      </section>

      <section>
        <h2 className="font-jp text-xs tracking-[0.2em] text-ink-soft mb-3">
          商品 · 選擇要{type === 'return' ? '退' : '換'}的商品
        </h2>
        <p className="text-xs text-ink-soft mb-3">
          不勾 = 整單{type === 'return' ? '退貨' : '換貨'}
        </p>
        <div className="space-y-2 bg-white border border-line rounded-lg p-4">
          {items.map((it) => (
            <label
              key={it.id}
              className="flex items-center gap-3 py-2 cursor-pointer"
            >
              <input
                type="checkbox"
                name="selectedOrderItemIds"
                value={it.id}
                className="w-4 h-4"
              />
              <div className="flex-1 text-sm">
                <p>{it.name}</p>
                <p className="text-xs text-ink-soft">
                  × {it.quantity} · {it.lineTotal}
                </p>
              </div>
            </label>
          ))}
        </div>
      </section>

      <div>
        <label htmlFor="reason" className="block text-sm mb-1.5">
          原因 <span className="text-danger">*</span>
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={5}
          required
          minLength={10}
          maxLength={1000}
          placeholder="例：商品有瑕疵 / 尺寸不合 / 品項錯誤等。請盡量詳細描述，方便客服盡快處理。"
          className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
        />
        <p className="text-xs text-ink-soft mt-1">至少 10 字，最多 1000 字</p>
      </div>

      <p className="text-xs text-ink-soft leading-relaxed bg-cream-100 rounded-md p-3">
        💡 送出申請後，客服會在 24 小時內透過 LINE 或 Email 聯繫你，並提供退貨地址。
        鑑賞期內可全額退款（運費除外）。
      </p>

      {state.error && (
        <p className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="font-jp w-full bg-ink text-cream py-3 rounded-md hover:bg-accent transition-colors disabled:opacity-50 tracking-wider"
      >
        {pending ? '送出中⋯' : '送出申請'}
      </button>
    </form>
  )
}
