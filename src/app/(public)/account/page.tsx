import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { customers, orders, adminUsers } from '@/db/schema'
import { OrderLookup } from '@/components/account/OrderLookup'
import { SocialLoginButtons } from '@/components/account/SocialLoginButtons'
import { getCustomerSession } from '@/lib/customer-session'
import { logoutAccountAction } from '@/server/actions/account'
import { ensureReferralCode } from '@/server/services/ReferralService'
import { STATUS_LABEL, statusBadgeClass } from '@/lib/order-progress'
import { formatTwd } from '@/lib/format'

export const metadata = {
  title: '會員中心',
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
  const params = await searchParams

  if (!session) return <LoggedOutView err={params.err} />
  return <DashboardView customerId={session.customerId} />
}

function LoggedOutView({ err }: { err?: string }) {
  const errMessage = err ? (ERR_LABEL[err] ?? decodeURIComponent(err)) : null
  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-12">
      <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">ACCOUNT · 會員</p>
      <h1 className="font-serif text-3xl mb-3 tracking-wide">會員登入</h1>
      <p className="text-ink-soft text-sm mb-8 leading-relaxed">
        登入後可以一覽所有訂單、調整通知偏好、推薦朋友。
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

async function DashboardView({ customerId }: { customerId: string }) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1)

  if (!customer) return <LoggedOutView />

  const [recentOrders, referralCode, allOrders, adminMatch] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt))
      .limit(3),
    ensureReferralCode(customerId),
    db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.customerId, customerId)),
    db
      .select({ role: adminUsers.role })
      .from(adminUsers)
      .where(eq(adminUsers.email, customer.email))
      .limit(1),
  ])

  const adminRole = adminMatch[0]?.role ?? null

  const totalOrders = allOrders.length
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <header className="flex items-start justify-between mb-10">
        <div>
          <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">
            ACCOUNT · マイページ
          </p>
          <h1 className="font-serif text-3xl tracking-wide">
            <span className="font-jp">こんにちは、</span>{customer.name ?? customer.email.split('@')[0]}
          </h1>
          <p className="text-ink-soft text-sm mt-1">{customer.email}</p>
        </div>
        <form action={logoutAccountAction}>
          <button
            type="submit"
            className="font-jp text-xs text-ink-soft hover:text-danger underline tracking-wider"
          >
            ログアウト · 登出
          </button>
        </form>
      </header>

      {adminRole && (
        <div className="mb-8 bg-ink text-cream rounded-lg p-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-70 mb-1">
              Staff Mode · {adminRole}
            </p>
            <p className="text-sm">
              你的 Email 也是後台管理員。後台需要另外用 Email + 密碼登入。
            </p>
          </div>
          <Link
            href="/admin"
            className="bg-cream text-ink px-4 py-2 rounded-md text-sm hover:bg-accent hover:text-cream transition-colors whitespace-nowrap"
          >
            進入後台 →
          </Link>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <DashCard
          href="/account/orders"
          title="ご注文 · 我的訂單"
          value={`${totalOrders} 件`}
          desc="查看所有訂單與進度"
        />
        <DashCard
          href="/account/addresses"
          title="お届け先 · 常用地址"
          value="📦"
          desc="收件地址管理（家、辦公室）"
        />
        <DashCard
          href="/account/coupons"
          title="クーポン · 優惠券"
          value="🎟"
          desc="可使用的優惠碼"
        />
        <DashCard
          href="/account/settings"
          title="設定 · 帳號設定"
          value="⚙"
          desc="通知偏好與基本資料"
        />
        <DashCard
          href="#referral"
          title="ご紹介 · 推薦朋友"
          value={referralCode}
          desc="朋友首單妳得購物金"
        />
      </div>

      <section className="mb-10">
        <header className="flex items-baseline justify-between mb-4">
          <h2 className="font-serif text-xl tracking-wide">
            <span className="font-jp text-xs tracking-[0.3em] text-ink-soft mr-3">最近のご注文</span>
            最近訂單
          </h2>
          <Link href="/account/orders" className="text-xs text-ink-soft hover:text-accent font-jp">
            一覧へ {totalOrders > 0 && `(${totalOrders})`} →
          </Link>
        </header>
        {recentOrders.length === 0 ? (
          <div className="py-12 text-center text-ink-soft border border-dashed border-line rounded-lg">
            目前沒有訂單。
            <Link href="/shop" className="underline hover:text-accent ml-2">
              逛逛選物
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {recentOrders.map((o) => (
              <li
                key={o.id}
                className="bg-white border border-line rounded-lg p-5 flex items-center justify-between"
              >
                <div>
                  <Link
                    href={`/track/${o.id}`}
                    className="font-mono text-sm hover:text-accent"
                  >
                    {o.orderNumber}
                  </Link>
                  <p className="text-xs text-ink-soft mt-1">
                    {new Date(o.createdAt).toLocaleString('zh-TW')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatTwd(o.total)}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${statusBadgeClass(o.status)}`}
                  >
                    {STATUS_LABEL[o.status]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        id="referral"
        className="bg-cream-100 border border-line rounded-lg p-6 scroll-mt-20"
      >
        <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-1">REFERRAL · ご紹介</p>
        <h2 className="font-serif text-xl mb-2 tracking-wide">推薦朋友</h2>
        <p className="text-ink-soft text-sm leading-relaxed mb-4">
          把這條連結傳給朋友，朋友首單成立後妳會獲得購物金。
        </p>
        <div className="bg-white border border-line rounded-md p-3 text-xs font-mono break-all select-all mb-3">
          {siteUrl}/api/referral/{referralCode}
        </div>
        <p className="text-xs text-ink-soft">
          推薦碼：<span className="font-mono">{referralCode}</span>
        </p>
      </section>
    </div>
  )
}

function DashCard({
  href,
  title,
  value,
  desc,
}: {
  href: string
  title: string
  value: string
  desc: string
}) {
  return (
    <Link
      href={href}
      className="bg-white border border-line rounded-lg p-5 hover:border-ink transition-colors block"
    >
      <p className="font-jp text-xs tracking-[0.2em] text-ink-soft mb-2">
        {title}
      </p>
      <p className="text-lg font-medium font-mono break-all">{value}</p>
      <p className="text-xs text-ink-soft mt-2">{desc}</p>
    </Link>
  )
}
