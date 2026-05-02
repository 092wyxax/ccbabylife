import { PROGRESS_STAGES, progressState } from '@/lib/order-progress'
import type { OrderStatus } from '@/db/schema'

interface Props {
  status: OrderStatus
}

export function OrderProgressBar({ status }: Props) {
  const state = progressState(status)

  if (state.kind === 'pending_payment') {
    return (
      <div className="bg-warning/15 border border-warning/40 rounded-lg p-5 text-sm">
        <p className="font-medium mb-1">等待付款</p>
        <p className="text-ink-soft">完成付款後我們會啟動日本下單流程，並推播 LINE 通知。</p>
      </div>
    )
  }

  if (state.kind === 'cancelled') {
    return (
      <div className="bg-ink/10 border border-ink/20 rounded-lg p-5 text-sm">
        <p className="font-medium mb-1">訂單已取消</p>
        <p className="text-ink-soft">如有疑問請直接私訊我們的 LINE。</p>
      </div>
    )
  }

  if (state.kind === 'refunded') {
    return (
      <div className="bg-danger/10 border border-danger/30 rounded-lg p-5 text-sm">
        <p className="font-medium mb-1">已退款</p>
        <p className="text-ink-soft">退款處理中，3–5 個工作天內款項會回到原付款帳戶。</p>
      </div>
    )
  }

  const currentIdx = state.index

  return (
    <div className="bg-white border border-line rounded-lg p-6">
      <ol className="flex items-start gap-2 overflow-x-auto pb-2">
        {PROGRESS_STAGES.map((stage, i) => {
          const isDone = i < currentIdx
          const isCurrent = i === currentIdx
          return (
            <li
              key={stage.status}
              className="flex-1 min-w-[68px] flex flex-col items-center text-center"
            >
              <div
                className={
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ' +
                  (isCurrent
                    ? 'bg-accent text-cream ring-4 ring-accent/20'
                    : isDone
                    ? 'bg-ink text-cream'
                    : 'bg-line text-ink-soft')
                }
              >
                {isDone ? '✓' : i + 1}
              </div>
              <span
                className={
                  'text-[11px] mt-2 leading-tight ' +
                  (isCurrent
                    ? 'text-ink font-medium'
                    : isDone
                    ? 'text-ink'
                    : 'text-ink-soft')
                }
              >
                {stage.label}
              </span>
              {i < PROGRESS_STAGES.length - 1 && (
                <div
                  className={
                    'absolute h-px hidden ' /* visual line; using siblings below would complicate */
                  }
                />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
