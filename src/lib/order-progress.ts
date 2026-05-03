import type { OrderStatus } from '@/db/schema'

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'お支払待ち · 待付款',
  paid: 'お支払済 · 已付款',
  sourcing_jp: '日本手配中 · 日本下單中',
  received_jp: '日本入荷 · 日本到貨',
  shipping_intl: '国際輸送中 · 國際集運中',
  arrived_tw: '台湾到着 · 台灣到港',
  shipped: '発送済 · 已出貨',
  completed: '完了 · 已完成',
  cancelled: 'キャンセル · 已取消',
  refunded: '返金済 · 已退款',
}

export const PROGRESS_STAGES: Array<{ status: OrderStatus; label: string }> = [
  { status: 'paid', label: 'お支払済' },
  { status: 'sourcing_jp', label: '日本手配' },
  { status: 'received_jp', label: '日本入荷' },
  { status: 'shipping_intl', label: '国際輸送' },
  { status: 'arrived_tw', label: '台湾到着' },
  { status: 'shipped', label: '発送済' },
  { status: 'completed', label: '完了' },
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
