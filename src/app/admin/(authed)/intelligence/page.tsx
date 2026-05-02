import { PlaceholderPage } from '@/components/admin/PlaceholderPage'

export default function AdminIntelligencePage() {
  return (
    <PlaceholderPage
      title="市場情報"
      subtitle="自動爬蟲 + AI 週報 + 競品追蹤"
      comingPhase="Phase 5 Week 17+"
      bullets={[
        'PTT / Dcard / 蝦皮 / Google Trends 趨勢',
        '競品商家上下架快照',
        'Claude 每週自動產出進貨建議',
        '客戶 Embedding 個人化推薦',
      ]}
    />
  )
}
