'use client'

import { useActionState } from 'react'
import {
  createLogisticsAction,
  type LogisticsActionState,
} from '@/server/actions/logistics'

const initial: LogisticsActionState = {}

const CVS_LABEL: Record<string, string> = {
  cvs_711: '7-ELEVEN',
  cvs_family: '全家',
  cvs_hilife: '萊爾富',
  cvs_okmart: 'OK 超商',
}

interface Props {
  orderId: string
  shippingMethod: string
  cvsStoreName: string | null
  cvsStoreId: string | null
  ecpayLogisticsId: string | null
  cvsPaymentNo: string | null
  cvsValidationNo: string | null
  canCreate: boolean
}

export function CvsLogisticsPanel({
  orderId,
  shippingMethod,
  cvsStoreName,
  cvsStoreId,
  ecpayLogisticsId,
  cvsPaymentNo,
  cvsValidationNo,
  canCreate,
}: Props) {
  const action = createLogisticsAction.bind(null, orderId)
  const [state, formAction, pending] = useActionState(action, initial)

  return (
    <div className="space-y-3 text-sm">
      <div className="bg-cream-100 border border-line rounded-md p-3 text-xs space-y-1">
        <p>
          <span className="text-ink-soft">配送方式：</span>
          {CVS_LABEL[shippingMethod] ?? shippingMethod}
        </p>
        <p>
          <span className="text-ink-soft">取貨門市：</span>
          {cvsStoreName ?? '—'}
          {cvsStoreId && (
            <span className="text-ink-soft ml-1">（門市代號 {cvsStoreId}）</span>
          )}
        </p>
        {ecpayLogisticsId && (
          <p>
            <span className="text-ink-soft">綠界物流單號：</span>
            <span className="font-mono">{ecpayLogisticsId}</span>
          </p>
        )}
        {cvsPaymentNo && (
          <p>
            <span className="text-ink-soft">寄件代碼：</span>
            <span className="font-mono">{cvsPaymentNo}</span>
          </p>
        )}
        {cvsValidationNo && (
          <p>
            <span className="text-ink-soft">驗證碼：</span>
            <span className="font-mono">{cvsValidationNo}</span>
          </p>
        )}
      </div>

      {!ecpayLogisticsId ? (
        <form action={formAction}>
          <button
            type="submit"
            disabled={pending || !canCreate}
            className="font-jp w-full bg-ink text-cream py-2.5 rounded-md hover:bg-accent transition-colors disabled:opacity-50 tracking-wider text-sm"
          >
            {pending ? '建立中⋯' : '建立綠界物流單'}
          </button>
          {!canCreate && (
            <p className="text-xs text-ink-soft mt-2">
              訂單需先到「已付款」或「日本到貨」/「台灣到貨」階段
            </p>
          )}
        </form>
      ) : (
        <a
          href={`/admin/orders/${orderId}/label`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-jp block w-full bg-ink text-cream text-center py-2.5 rounded-md hover:bg-accent transition-colors tracking-wider text-sm"
        >
          🖨 列印託運單
        </a>
      )}

      {state.error && (
        <p className="text-xs text-danger">{state.error}</p>
      )}
      {state.success && (
        <p className="text-xs text-success">{state.success}</p>
      )}
    </div>
  )
}
