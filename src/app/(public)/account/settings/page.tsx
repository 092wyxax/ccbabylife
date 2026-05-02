import Link from 'next/link'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { customers } from '@/db/schema'
import { getCustomerSession } from '@/lib/customer-session'
import { NotificationPrefsForm } from '@/components/account/NotificationPrefsForm'

export const metadata = {
  title: '帳號設定 | 日系選物店',
}

export default async function AccountSettingsPage() {
  const session = await getCustomerSession()
  if (!session) redirect('/account')

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, session.customerId))
    .limit(1)
  if (!customer) redirect('/account')

  const prefs = customer.notificationPrefs ?? { line: true, email: true }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/account/orders" className="hover:text-ink">我的訂單</Link>
        <span className="mx-2">/</span>
        <span>帳號設定</span>
      </nav>

      <h1 className="font-serif text-3xl mb-8">帳號設定</h1>

      <section className="bg-white border border-line rounded-lg p-6 mb-8">
        <h2 className="font-serif text-lg mb-4">通知偏好</h2>
        <NotificationPrefsForm
          initialLine={prefs.line}
          initialEmail={prefs.email}
        />
      </section>

      <section className="bg-white border border-line rounded-lg p-6 text-sm space-y-2">
        <h2 className="font-serif text-lg mb-3">基本資料</h2>
        <Row label="Email" value={customer.email} />
        <Row label="姓名" value={customer.name ?? '未提供'} />
        <Row label="電話" value={customer.phone ?? '未提供'} />
        <Row
          label="LINE"
          value={customer.lineUserId ? '已綁定' : 'LINE Login 待開通'}
        />
        <p className="text-xs text-ink-soft mt-3 leading-relaxed">
          基本資料修改：請於下次結帳時更新，或私訊我們的 LINE 客服。
          LINE 登入功能會在 LINE 帳號審核完成後開放。
        </p>
      </section>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-soft">{label}</span>
      <span>{value}</span>
    </div>
  )
}
