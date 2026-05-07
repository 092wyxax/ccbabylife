'use client'

import { useActionState } from 'react'
import {
  updateTrackingAction,
  type UpdateTrackingState,
} from '@/server/actions/orders'

interface Props {
  orderId: string
  trackingNumber: string | null
  shippingProvider: string | null
}

const PROVIDER_OPTIONS = ['黑貓', '宅配通', '新竹物流', '郵局', '7-11', '全家', '萊爾富', 'OK', '其他']

export function TrackingForm({ orderId, trackingNumber, shippingProvider }: Props) {
  const [state, action, pending] = useActionState<UpdateTrackingState, FormData>(
    updateTrackingAction,
    {}
  )

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />

      {state.error && (
        <p className="text-xs text-danger">{state.error}</p>
      )}
      {state.success && (
        <p className="text-xs text-success">{state.success}</p>
      )}

      <div>
        <label htmlFor="shippingProvider" className="block text-xs text-ink-soft mb-1">
          物流業者
        </label>
        <input
          id="shippingProvider"
          name="shippingProvider"
          list="provider-suggest"
          maxLength={40}
          defaultValue={shippingProvider ?? ''}
          placeholder="例：黑貓"
          className="w-full border border-line rounded px-2 py-1 text-sm focus:outline-none focus:border-ink"
        />
        <datalist id="provider-suggest">
          {PROVIDER_OPTIONS.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </div>

      <div>
        <label htmlFor="trackingNumber" className="block text-xs text-ink-soft mb-1">
          追蹤碼
        </label>
        <input
          id="trackingNumber"
          name="trackingNumber"
          maxLength={80}
          defaultValue={trackingNumber ?? ''}
          placeholder="例：1234-5678-9012"
          className="w-full font-mono border border-line rounded px-2 py-1 text-sm focus:outline-none focus:border-ink"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ink text-cream py-1.5 rounded text-sm hover:bg-accent disabled:opacity-50"
      >
        {pending ? '儲存中⋯' : '儲存物流資訊'}
      </button>
    </form>
  )
}
