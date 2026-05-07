import Link from 'next/link'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { customers } from '@/db/schema'
import { getCustomerSession } from '@/lib/customer-session'
import { NotificationPrefsForm } from '@/components/account/NotificationPrefsForm'
import { BabyInfoForm } from '@/components/account/BabyInfoForm'

export const metadata = {
  title: '帳號設定',
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
        <Link href="/account" className="hover:text-ink">會員中心</Link>
        <span className="mx-2">/</span>
        <span>帳號設定</span>
      </nav>

      <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">
        SETTINGS · アカウント設定
      </p>
      <h1 className="font-serif text-3xl mb-8 tracking-wide">帳號設定</h1>

      <section className="bg-white border border-line rounded-lg p-6 mb-8">
        <p className="font-jp text-xs tracking-[0.2em] text-ink-soft mb-1">
          通知設定
        </p>
        <h2 className="font-serif text-lg mb-4 tracking-wide">通知偏好</h2>
        <NotificationPrefsForm
          initialLine={prefs.line}
          initialEmail={prefs.email}
        />
      </section>

      <section className="bg-white border border-line rounded-lg p-6 text-sm space-y-2">
        <p className="font-jp text-xs tracking-[0.2em] text-ink-soft mb-1">
          基本情報
        </p>
        <h2 className="font-serif text-lg mb-3 tracking-wide">基本資料</h2>
        <Row label="メール · Email" value={customer.email} />
        <Row label="お名前 · 姓名" value={customer.name ?? '未提供'} />
        <Row label="電話 · 電話" value={customer.phone ?? '未提供'} />
        <Row
          label="LINE"
          value={customer.lineUserId ? '連携済 · 已綁定' : 'LINE Login 待開通'}
        />

        {customer.babyBirthDate ? (
          <Row
            label="赤ちゃんの誕生日 · 寶寶生日"
            value={new Date(customer.babyBirthDate).toLocaleDateString('zh-TW')}
          />
        ) : (
          <div className="pt-3 border-t border-line mt-3">
            <p className="font-jp text-ink-soft mb-2">
              赤ちゃんの誕生日 · 寶寶生日
            </p>
            <BabyInfoForm initialBabyBirthDate={null} />
          </div>
        )}

        <p className="text-xs text-ink-soft mt-3 leading-relaxed">
          基本資料修改：請於下次結帳時更新，或私訊我們的 LINE 客服。
          {customer.babyBirthDate && '寶寶生日設定後無法自行修改，如需更正請聯繫客服。'}
          LINE 登入功能會在 LINE 帳號審核完成後開放。
        </p>
      </section>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="font-jp text-ink-soft">{label}</span>
      <span>{value}</span>
    </div>
  )
}
