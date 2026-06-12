import Link from 'next/link'
import { requireRole } from '@/server/services/AdminAuthService'
import { getStoreSettings } from '@/server/services/StoreSettingsService'
import { SettingsForm } from './SettingsForm'

export const dynamic = 'force-dynamic'

function envStatus(key: string): boolean {
  return Boolean(process.env[key])
}

export default async function AdminSettingsPage() {
  await requireRole(['owner'])
  const settings = await getStoreSettings()

  const integrations: Array<{ label: string; ok: boolean; note?: string }> = [
    { label: 'LINE 登入', ok: envStatus('LINE_LOGIN_CHANNEL_ID') },
    { label: 'LINE 推播（Messaging API）', ok: envStatus('LINE_MESSAGING_ACCESS_TOKEN') },
    { label: '綠界金流', ok: envStatus('ECPAY_MERCHANT_ID'), note: process.env.ECPAY_ENV === 'stage' ? '測試環境' : undefined },
    { label: 'Email（Resend）', ok: envStatus('RESEND_API_KEY') },
    { label: 'AI 商品建檔（Anthropic）', ok: envStatus('ANTHROPIC_API_KEY') },
    { label: 'AI 助理（DeepSeek）', ok: envStatus('DEEPSEEK_API_KEY') },
    { label: 'Sentry 錯誤監控', ok: envStatus('SENTRY_DSN') },
    { label: 'Turnstile 人機驗證', ok: envStatus('TURNSTILE_SECRET_KEY') },
  ]

  return (
    <div className="p-6 sm:p-8 max-w-4xl space-y-8">
      <header>
        <h1 className="font-serif text-2xl">設定中心</h1>
        <p className="text-sm text-ink-soft mt-1">
          全店營運參數與整合狀態（僅店主可修改）
        </p>
      </header>

      <section className="bg-white border border-line rounded-lg p-6">
        <h2 className="font-serif text-lg mb-1">營運參數</h2>
        {settings.updatedAt && (
          <p className="text-[11px] text-ink-soft mb-4">
            上次更新：{settings.updatedAt.toLocaleString('zh-TW')}
            {settings.updatedByEmail ? `（${settings.updatedByEmail}）` : ''}
          </p>
        )}
        <SettingsForm
          botRate={settings.botRate}
          freeShipThresholdTwd={settings.freeShipThresholdTwd}
        />
      </section>

      <section className="bg-white border border-line rounded-lg p-6">
        <h2 className="font-serif text-lg mb-4">整合狀態</h2>
        <ul className="grid sm:grid-cols-2 gap-2">
          {integrations.map((it) => (
            <li
              key={it.label}
              className="flex items-center gap-2 text-sm py-1.5"
            >
              <span
                className={
                  'inline-block w-2 h-2 rounded-full ' +
                  (it.ok ? 'bg-green-500' : 'bg-gray-300')
                }
              />
              {it.label}
              <span className="text-xs text-ink-soft">
                {it.ok ? (it.note ? `已連接 · ${it.note}` : '已連接') : '未設定'}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-ink-soft mt-4 leading-relaxed">
          API 金鑰存放於主機環境變數（Zeabur → 環境變數），此處僅顯示狀態。
          詳細檢查請見
          <Link href="/admin/system-health" className="underline hover:text-accent ml-1">
            系統健康
          </Link>
          ；AI 小幫手的店家備忘請到
          <Link href="/admin/settings/ai" className="underline hover:text-accent ml-1">
            AI 設定
          </Link>
          。
        </p>
      </section>

      <section className="bg-white border border-line rounded-lg p-6">
        <h2 className="font-serif text-lg mb-4">本店資訊</h2>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-xs text-ink-soft">公司名稱（發票用）</dt>
            <dd className="mt-0.5">{process.env.COMPANY_NAME ?? '未設定'}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-soft">統一編號</dt>
            <dd className="mt-0.5 tabular-nums">{process.env.COMPANY_TAX_ID ?? '未設定'}</dd>
          </div>
        </dl>
        <p className="text-[11px] text-ink-soft mt-4">
          公司資訊用於電子發票開立，如需變更請至 Zeabur 環境變數修改
          <span className="font-mono mx-1">COMPANY_NAME</span>/
          <span className="font-mono mx-1">COMPANY_TAX_ID</span>後重新部署。
        </p>
      </section>
    </div>
  )
}
