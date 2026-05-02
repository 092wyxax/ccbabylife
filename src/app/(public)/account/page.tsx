import { OrderLookup } from '@/components/account/OrderLookup'

export const metadata = {
  title: '會員中心 / 訂單查詢 | 日系選物店',
}

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">
        Account
      </p>
      <h1 className="font-serif text-3xl mb-3">查詢我的訂單</h1>
      <p className="text-ink-soft text-sm mb-8 leading-relaxed">
        輸入訂單編號 + 下單時填的 Email，即可查看訂單進度。
        正式 LINE 登入功能會在 LINE 帳號審核完成後開放，到時會自動帶出妳的所有訂單，不必每次手動查詢。
      </p>

      <OrderLookup />
    </div>
  )
}
