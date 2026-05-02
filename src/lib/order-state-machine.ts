import type { OrderStatus } from '@/db/schema/orders'

export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['sourcing_jp', 'cancelled', 'refunded'],
  sourcing_jp: ['received_jp', 'cancelled', 'refunded'],
  received_jp: ['shipping_intl', 'cancelled', 'refunded'],
  shipping_intl: ['arrived_tw', 'refunded'],
  arrived_tw: ['shipped', 'refunded'],
  shipped: ['completed', 'refunded'],
  completed: ['refunded'],
  cancelled: ['refunded'],
  refunded: [],
}

export class InvalidStatusTransitionError extends Error {
  constructor(public from: OrderStatus, public to: OrderStatus) {
    super(`Invalid status transition: ${from} -> ${to}`)
    this.name = 'InvalidStatusTransitionError'
  }
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to)
}
