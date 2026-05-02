import type { OrderStatus } from '@/db/schema'

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: '待付款',
  paid: '已付款',
  sourcing_jp: '日本下單中',
  received_jp: '日本到貨',
  shipping_intl: '國際集運中',
  arrived_tw: '台灣到港',
  shipped: '已出貨',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款',
}

export const PROGRESS_STAGES: Array<{ status: OrderStatus; label: string }> = [
  { status: 'paid', label: '已付款' },
  { status: 'sourcing_jp', label: '日本下單' },
  { status: 'received_jp', label: '日本到貨' },
  { status: 'shipping_intl', label: '國際集運' },
  { status: 'arrived_tw', label: '台灣到港' },
  { status: 'shipped', label: '已出貨' },
  { status: 'completed', label: '已完成' },
]

export type ProgressState =
  | { kind: 'pending_payment' }
  | { kind: 'progress'; index: number }
  | { kind: 'cancelled' }
  | { kind: 'refunded' }

export function progressState(status: OrderStatus): ProgressState {
  if (status === 'pending_payment') return { kind: 'pending_payment' }
  if (status === 'cancelled') return { kind: 'cancelled' }
  if (status === 'refunded') return { kind: 'refunded' }
  const idx = PROGRESS_STAGES.findIndex((s) => s.status === status)
  return { kind: 'progress', index: idx }
}

export function statusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case 'pending_payment':
      return 'bg-warning/20 text-ink'
    case 'paid':
    case 'sourcing_jp':
    case 'received_jp':
    case 'shipping_intl':
    case 'arrived_tw':
    case 'shipped':
      return 'bg-line text-ink'
    case 'completed':
      return 'bg-success/20 text-ink'
    case 'cancelled':
      return 'bg-ink/10 text-ink-soft'
    case 'refunded':
      return 'bg-danger/15 text-danger'
  }
}
