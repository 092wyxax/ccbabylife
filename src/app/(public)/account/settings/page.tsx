import Link from 'next/link'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { customers } from '@/db/schema'
import { getCustomerSession } from '@/lib/customer-session'
import { NotificationPrefsForm } from '@/components/account/NotificationPrefsForm'
import { BabyInfoForm } from '@/components/account/BabyInfoForm'
import { listAddressesForCustomer } from '@/server/services/AddressService'

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

  // Fallback phone: customer.phone → default saved address → first saved address
  let phoneDisplay = customer.phone
  if (!phoneDisplay) {
    const addresses = await listAddressesForCustomer(session.customerId)
    const fallback =
      addresses.find((a) => a.isDefault)?.phone ?? addresses[0]?.phone ?? null
    if (fallback) phoneDisplay = fallback
  }

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
        <Row label="電話 · 電話" value={phoneDisplay ?? '未提供'} />
        <div className="flex justify-between items-center">
          <span className="font-jp text-ink-soft">LINE</span>
          {customer.lineUserId ? (
            <span className="text-success">連携済 · 已綁定 ✓</span>
          ) : (
            <Link
              href="/auth/line/start?next=/account/settings"
              className="font-jp text-xs bg-[#06C755] text-white px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity tracking-wider"
            >
              用 LINE 連結帳號
            </Link>
          )}
        </div>

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
          {!customer.lineUserId &&
            ' 綁定 LINE 後，訂單狀態與優惠通知會即時推到你的 LINE。'}
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
