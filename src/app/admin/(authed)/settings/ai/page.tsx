import { requireRole } from '@/server/services/AdminAuthService'
import { getStoreSettings } from '@/server/services/StoreSettingsService'
import {
  getAiUsageSummary,
  getDeepSeekBalance,
} from '@/server/services/AdminAiService'
import { AiNotesForm } from './AiNotesForm'

export const dynamic = 'force-dynamic'

export default async function AiSettingsPage() {
  await requireRole(['owner', 'manager'])
  const deepseekReady = Boolean(process.env.DEEPSEEK_API_KEY)
  const [settings, usage, balance] = await Promise.all([
    getStoreSettings(),
    getAiUsageSummary(),
    getDeepSeekBalance(),
  ])

  return (
    <div className="p-6 sm:p-8 max-w-3xl space-y-8">
      <header>
        <h1 className="font-serif text-2xl">AI 設定</h1>
        <p className="text-sm text-ink-soft mt-1">
          告訴 AI 小幫手關於這間店的事，它每次回答都會參考
        </p>
      </header>

      <section className="flex items-center gap-2 text-sm bg-white border border-line rounded-lg px-4 py-3">
        <span
          className={
            'inline-block w-2 h-2 rounded-full ' +
            (deepseekReady ? 'bg-green-500' : 'bg-red-400')
          }
        />
        AI 小幫手（DeepSeek）
        <span className="text-xs text-ink-soft">
          {deepseekReady ? '已連接，可在右下角 ✨ 對話' : '未設定 DEEPSEEK_API_KEY，AI 功能暫停'}
        </span>
      </section>

      <section className="bg-white border border-line rounded-lg p-6">
        <h2 className="font-serif text-lg mb-4">本月用量與費用</h2>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-xs text-ink-soft">本月對話次數</dt>
            <dd className="mt-0.5 text-lg tabular-nums">{usage.monthCalls}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-soft">本月 tokens</dt>
            <dd className="mt-0.5 text-lg tabular-nums">
              {((usage.monthInputTokens + usage.monthOutputTokens) / 1000).toFixed(1)}K
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-soft">本月估算費用</dt>
            <dd className="mt-0.5 text-lg tabular-nums">
              {usage.monthCostTwd < 0.01
                ? 'NT$0'
                : `NT$${usage.monthCostTwd.toFixed(usage.monthCostTwd < 1 ? 2 : 0)}`}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-soft">DeepSeek 帳戶餘額</dt>
            <dd className="mt-0.5 text-lg tabular-nums">
              {balance ? `${balance.totalBalance} ${balance.currency}` : '查無'}
            </dd>
          </div>
        </dl>
        <p className="text-[11px] text-ink-soft mt-4 leading-relaxed">
          費用為依 DeepSeek 牌價的估算上限（未計快取折扣，實際通常更低）；
          餘額為 DeepSeek 官方即時資料。累計總呼叫 {usage.totalCalls} 次。
        </p>
      </section>

      <section className="bg-white border border-line rounded-lg p-6">
        <h2 className="font-serif text-lg mb-1">店家備忘（AI 的記憶）</h2>
        <p className="text-xs text-ink-soft leading-relaxed mb-4">
          這裡寫的內容，AI 小幫手對話和收件匣「AI 草擬」都會帶入參考。
          適合放：公司／品牌名稱、出貨與退換貨規則、客服口吻偏好、常見問題的標準說法。
          {settings.updatedAt && (
            <>
              <br />
              上次更新：{settings.updatedAt.toLocaleString('zh-TW')}
              {settings.updatedByEmail ? `（${settings.updatedByEmail}）` : ''}
            </>
          )}
        </p>
        <AiNotesForm aiNotes={settings.aiNotes} />
      </section>

      <section className="bg-cream-100 border border-line rounded-lg p-5 text-xs text-ink-soft leading-relaxed">
        <p className="font-medium text-ink mb-1.5">💡 小提醒</p>
        <ul className="list-disc list-inside space-y-1">
          <li>寫得越具體，AI 回答越準（「每週四截單」比「定期截單」好）。</li>
          <li>不要放密碼、API 金鑰等機密 —— 這份備忘會送給 AI 模型參考。</li>
          <li>營收、訂單、庫存等數字 AI 會自己查資料庫，不用寫在這裡。</li>
          <li>存檔後立即生效，開新對話試問即可驗證。</li>
        </ul>
      </section>
    </div>
  )
}
