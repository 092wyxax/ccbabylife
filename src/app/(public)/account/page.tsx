import { redirect } from 'next/navigation'
import { OrderLookup } from '@/components/account/OrderLookup'
import { SocialLoginButtons } from '@/components/account/SocialLoginButtons'
import { getCustomerSession } from '@/lib/customer-session'

export const metadata = {
  title: '會員登入 | 日系選物店',
}

const ERR_LABEL: Record<string, string> = {
  'no-code': 'Google 沒有回傳授權碼，請再試一次',
  'no-email': 'Google 沒有回傳 Email，請改用其他方式登入',
  blacklisted: '此帳號目前無法登入，請聯繫 LINE 客服',
  'state-mismatch': 'OAuth state 驗證失敗，請再試一次',
  'line-not-configured': 'LINE 登入尚未設定（管理員需填 .env.local）',
  'line-no-code': 'LINE 沒有回傳授權碼',
  'line-token-fail': 'LINE 換 token 失敗，請重試',
  'line-jwt-invalid': 'LINE 簽章驗證失敗',
  'line-no-email': 'LINE 沒有回傳 Email — Email scope 尚未通過審核，可改用 Google',
}

interface Props {
  searchParams: Promise<{ err?: string }>
}

export default async function AccountPage({ searchParams }: Props) {
  const session = await getCustomerSession()
  if (session) redirect('/account/orders')

  const params = await searchParams
  const errMessage = params.err
    ? (ERR_LABEL[params.err] ?? decodeURIComponent(params.err))
    : null

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-12">
      <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">Account</p>
      <h1 className="font-serif text-3xl mb-3">登入 / 查訂單</h1>
      <p className="text-ink-soft text-sm mb-8 leading-relaxed">
        登入後可以一覽所有訂單、調整通知偏好。
      </p>

      {errMessage && (
        <div className="mb-6 bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
          {errMessage}
        </div>
      )}

      <SocialLoginButtons />

      <div className="my-8 flex items-center gap-3 text-xs text-ink-soft">
        <span className="flex-1 h-px bg-line" />
        或
        <span className="flex-1 h-px bg-line" />
      </div>

      <details className="mb-4">
        <summary className="text-sm cursor-pointer text-ink-soft hover:text-ink">
          沒登入帳號？用訂單編號 + Email 查詢
        </summary>
        <div className="mt-4">
          <OrderLookup />
        </div>
      </details>

      <p className="mt-12 text-xs text-ink-soft leading-relaxed">
        ⚠ LINE Email scope 若還沒通過審核，LINE 登入會無法取得 Email — 此時請改用 Google 登入，
        或先用訂單編號 + Email 查詢。
      </p>
    </div>
  )
}
