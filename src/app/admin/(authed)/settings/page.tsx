import { PlaceholderPage } from '@/components/admin/PlaceholderPage'

export default function AdminSettingsPage() {
  return (
    <PlaceholderPage
      title="設定中心"
      subtitle="一般設定、整合、權限管理"
      comingPhase="後續 Phase"
      bullets={[
        '本店資訊（公司名、統編、營業時間）',
        '整合：LINE、綠界、黑貓、AI 模型',
        '匯率／運費／服務費調整',
        '管理員帳號與權限',
        '稽核紀錄查詢',
      ]}
    />
  )
}
