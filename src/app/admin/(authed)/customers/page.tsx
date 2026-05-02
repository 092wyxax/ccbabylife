import { PlaceholderPage } from '@/components/admin/PlaceholderPage'

export default function AdminCustomersPage() {
  return (
    <PlaceholderPage
      title="客戶管理"
      subtitle="CRM：分群、寶寶月齡、LTV、購物金"
      comingPhase="Phase 1a Week 7+"
      bullets={[
        '客戶清單 + 分群（依寶寶月齡 / LTV / 推薦來源）',
        '黑名單管理',
        '購物金紀錄與調整',
        '客戶詳細頁（訂單歷史、LINE 紀錄）',
      ]}
    />
  )
}
