'use client'

import { useActionState } from 'react'
import {
  pushCouponToLineOaAction,
  type PushCouponState,
} from '@/server/actions/coupons'

const initial: PushCouponState = {}

interface Props {
  couponId: string
  couponCode: string
  isActive: boolean
}

export function CouponLineBroadcastButton({
  couponId,
  couponCode,
  isActive,
}: Props) {
  const action = pushCouponToLineOaAction.bind(null, couponId)
  const [state, formAction, pending] = useActionState(action, initial)

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !confirm(
            `確定要把優惠券「${couponCode}」廣播到 LINE 官方帳號的所有好友嗎？此動作無法復原，且會消耗 push 額度（每位好友 1 push）。`
          )
        ) {
          e.preventDefault()
        }
      }}
      className="space-y-2"
    >
      <button
        type="submit"
        disabled={pending || !isActive}
        className="font-jp text-sm bg-ink text-cream px-4 py-2 rounded-md hover:bg-accent transition-colors disabled:opacity-50 tracking-wider"
      >
        {pending ? '推送中⋯' : 'LINE OA に配信 · 推送到 LINE 全好友'}
      </button>
      {!isActive && (
        <p className="text-xs text-warning">優惠券需先啟用才能推送</p>
      )}
      {state.error && (
        <p className="text-xs text-danger break-all">{state.error}</p>
      )}
      {state.success && (
        <p className="text-xs text-accent">{state.success}</p>
      )}
    </form>
  )
}
