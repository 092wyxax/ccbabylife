import type { PurchaseStatus } from '@/db/schema/purchases'

export const PURCHASE_STATUS_LABEL: Record<PurchaseStatus, string> = {
  planning: '規劃中',
  submitted: '已下單',
  received_jp: '日本到貨',
  completed: '已完成',
  cancelled: '已取消',
}

export function purchaseStatusBadge(status: PurchaseStatus): string {
  switch (status) {
    case 'planning':
      return 'bg-line text-ink'
    case 'submitted':
      return 'bg-warning/20 text-ink'
    case 'received_jp':
      return 'bg-accent/20 text-ink'
    case 'completed':
      return 'bg-success/20 text-ink'
    case 'cancelled':
      return 'bg-ink/10 text-ink-soft'
  }
}

export const SUPPLIER_TYPE_LABEL = {
  rakuten: '樂天市場',
  amazon_jp: 'Amazon JP',
  superdelivery: 'SuperDelivery',
  direct: '品牌直購',
  other: '其他',
} as const
