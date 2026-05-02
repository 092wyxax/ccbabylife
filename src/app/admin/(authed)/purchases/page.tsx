import { PlaceholderPage } from '@/components/admin/PlaceholderPage'

export default function AdminPurchasesPage() {
  return (
    <PlaceholderPage
      title="採購管理"
      subtitle="PMS：供應商、採購單、毛利追蹤"
      comingPhase="Phase 4 Week 14"
      bullets={[
        '供應商清單（樂天、SuperDelivery 等）',
        '每週批次採購單',
        '到貨對帳 + 短缺處理',
        '實際成本 vs 公式成本差異',
      ]}
    />
  )
}
