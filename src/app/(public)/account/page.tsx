import Link from 'next/link'
import { redirect } from 'next/navigation'
import { OrderLookup } from '@/components/account/OrderLookup'
import { getCustomerSession } from '@/lib/customer-session'

export const metadata = {
  title: '會員中心 / 訂單查詢 | 日系選物店',
}

export default async function AccountPage() {
  const session = await getCustomerSession()
  if (session) {
    redirect('/account/orders')
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">
        Account
      </p>
      <h1 className="font-serif text-3xl mb-3">查詢我的訂單</h1>
      <p className="text-ink-soft text-sm mb-8 leading-relaxed">
        輸入訂單編號 + 下單時填的 Email，即可查看訂單進度。
        驗證成功後我們會記住妳的 Email（瀏覽器 cookie，30 天），下次直接列出妳的所有訂單。
        <br />
        正式 LINE 登入會在 LINE 帳號審核完成後開放。
      </p>

      <OrderLookup />

      <p className="mt-8 text-xs text-ink-soft">
        想看以前查過的訂單？只需重新輸入任一張訂單編號 + Email，所有歷史訂單會一次出現。
        如果你之前已經查詢過，請直接到{' '}
        <Link href="/account/orders" className="underline hover:text-accent">
          /account/orders
        </Link>
        。
      </p>
    </div>
  )
}
