'use client'

import { useActionState, useRef, useEffect } from 'react'
import {
  grantCouponAction,
  type GrantCouponState,
} from '@/server/actions/coupons'

interface Props {
  couponId: string
}

export function CouponGrantForm({ couponId }: Props) {
  const ref = useRef<HTMLFormElement>(null)
  const boundAction = grantCouponAction.bind(null, couponId)
  const [state, formAction, pending] = useActionState<GrantCouponState, FormData>(
    boundAction,
    {}
  )

  useEffect(() => {
    if (!pending && state.granted !== undefined && !state.error && ref.current) {
      const ta = ref.current.querySelector('textarea')
      if (ta) ta.value = ''
    }
  }, [pending, state])

  return (
    <form ref={ref} action={formAction} className="space-y-3">
      {state.error && (
        <div className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
          {state.error}
        </div>
      )}

      {(state.granted !== undefined || state.alreadyHad) && (
        <div className="bg-success/10 border border-success/40 text-ink text-sm p-3 rounded-md space-y-1">
          {state.granted! > 0 && (
            <p>✓ 成功發放給 {state.granted} 位客戶</p>
          )}
          {state.alreadyHad! > 0 && (
            <p className="text-ink-soft">
              · {state.alreadyHad} 位已經擁有此優惠券，已跳過
            </p>
          )}
          {state.notFound && state.notFound.length > 0 && (
            <details className="text-ink-soft">
              <summary className="cursor-pointer">
                ⚠ {state.notFound.length} 個 Email 找不到對應會員
              </summary>
              <ul className="mt-1 list-disc list-inside text-xs space-y-0.5">
                {state.notFound.map((e) => (
                  <li key={e} className="font-mono">{e}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <textarea
        name="emails"
        rows={4}
        placeholder="貼上 Email（一行一個，或用逗號分隔）&#10;mary@example.com&#10;peter@example.com"
        className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink text-sm font-mono"
      />

      <div className="flex justify-between items-center">
        <p className="text-xs text-ink-soft">單次最多 200 筆</p>
        <button
          type="submit"
          disabled={pending}
          className="bg-ink text-cream px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50"
        >
          {pending ? '發放中⋯' : '發放給這些會員'}
        </button>
      </div>
    </form>
  )
}
