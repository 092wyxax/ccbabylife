import Link from 'next/link'

export default function AdminMarketingPage() {
  return (
    <div className="p-8 max-w-3xl">
      <h1 className="font-serif text-2xl mb-1">行銷推播</h1>
      <p className="text-ink-soft text-sm mb-8">LINE 群發、優惠券、預覽</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/admin/marketing/line-preview"
          className="bg-white border border-line rounded-lg p-5 hover:border-ink transition-colors"
        >
          <h2 className="font-medium mb-1">LINE 訊息範本預覽</h2>
          <p className="text-xs text-ink-soft leading-relaxed">
            檢視 7 組 LINE 訊息（加好友、訂單通知、催繳、月齡推送）的渲染結果，
            等 LINE Messaging API 接上後可直接寄送測試。
          </p>
        </Link>

        <div className="bg-cream-100 border border-line rounded-lg p-5 opacity-70 cursor-not-allowed">
          <h2 className="font-medium mb-1">LINE 群發（Phase 2）</h2>
          <p className="text-xs text-ink-soft">需 LINE Messaging API channel 已設定</p>
        </div>

        <Link
          href="/admin/marketing/coupons"
          className="bg-white border border-line rounded-lg p-5 hover:border-ink transition-colors"
        >
          <h2 className="font-medium mb-1">優惠券</h2>
          <p className="text-xs text-ink-soft leading-relaxed">
            建立固定金額或百分比優惠碼，設定低消與使用上限。
          </p>
        </Link>

        <div className="bg-cream-100 border border-line rounded-lg p-5 opacity-70 cursor-not-allowed">
          <h2 className="font-medium mb-1">Email 群發（Phase 1b 後）</h2>
          <p className="text-xs text-ink-soft">需 Resend domain 設定完成</p>
        </div>
      </div>
    </div>
  )
}
