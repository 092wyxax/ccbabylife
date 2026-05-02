import { PlaceholderPage } from '@/components/admin/PlaceholderPage'

export default function AdminInventoryPage() {
  return (
    <PlaceholderPage
      title="庫存管理"
      subtitle="WMS：盤點、揀貨、庫存警報"
      comingPhase="Phase 4 Week 13"
      bullets={[
        '現貨庫存即時管理',
        '盤點作業 + 差異報表',
        '低庫存警報（推 LINE 給先生）',
        '揀貨單列印',
      ]}
    />
  )
}
