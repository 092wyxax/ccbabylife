import Link from 'next/link'
import { redirect } from 'next/navigation'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { coupons, customerCoupons } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { getCustomerSession } from '@/lib/customer-session'
import { formatTwd } from '@/lib/format'

export const metadata = {
  title: '我的優惠券',
}

export default async function MyCouponsPage() {
  const session = await getCustomerSession()
  if (!session) redirect('/account')

  const claimed = await db
    .select({
      claim: customerCoupons,
      coupon: coupons,
    })
    .from(customerCoupons)
    .innerJoin(coupons, eq(coupons.id, customerCoupons.couponId))
    .where(eq(customerCoupons.customerId, session.customerId))
    .orderBy(desc(customerCoupons.claimedAt))

  // Public coupons (active + not expired) the customer hasn't claimed yet
  const claimedIds = claimed.map((c) => c.coupon.id)
  const publicCoupons = await db
    .select()
    .from(coupons)
    .where(
      and(
        eq(coupons.orgId, DEFAULT_ORG_ID),
        eq(coupons.isActive, true),
        ...(claimedIds.length > 0
          ? [sql`${coupons.id} NOT IN ${claimedIds}`]
          : [])
      )
    )
    .orderBy(asc(coupons.code))
    .limit(20)

  const usable = claimed.filter((c) => !c.claim.usedAt)
  const used = claimed.filter((c) => c.claim.usedAt)

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/account" className="hover:text-ink">會員中心</Link>
        <span className="mx-2">/</span>
        <span>我的優惠券</span>
      </nav>

      <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">
        COUPONS · クーポン
      </p>
      <h1 className="font-serif text-3xl mb-8 tracking-wide">我的優惠券</h1>

      <section className="mb-10">
        <h2 className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-3">
          ご利用可能 · 可使用（{usable.length}）
        </h2>
        {usable.length === 0 ? (
          <div className="py-10 text-center text-ink-soft border border-dashed border-line rounded-lg">
            目前沒有可使用的優惠券。
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-3">
            {usable.map(({ coupon }) => (
              <CouponCard key={coupon.id} coupon={coupon} />
            ))}
          </ul>
        )}
      </section>

      {publicCoupons.length > 0 && (
        <section className="mb-10">
          <h2 className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-3">
            公開クーポン · 目前可用的公開優惠
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {publicCoupons.map((c) => (
              <CouponCard key={c.id} coupon={c} note="結帳時直接輸入代碼即可使用" />
            ))}
          </ul>
        </section>
      )}

      {used.length > 0 && (
        <section className="opacity-60">
          <h2 className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-3">
            ご利用済み · 已使用（{used.length}）
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {used.map(({ coupon, claim }) => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                used
                note={`使用於 ${new Date(claim.usedAt!).toLocaleDateString('zh-TW')}`}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function CouponCard({
  coupon,
  note,
  used,
}: {
  coupon: typeof coupons.$inferSelect
  note?: string
  used?: boolean
}) {
  return (
    <li
      className={
        'rounded-lg border p-5 ' +
        (used
          ? 'bg-ink/5 border-line'
          : 'bg-cream-100 border-accent/40')
      }
    >
      <p className="text-2xl font-medium mb-1">
        {coupon.type === 'fixed'
          ? `−${formatTwd(coupon.value)}`
          : `−${coupon.value}%`}
      </p>
      <p className="font-mono text-sm select-all bg-white border border-line rounded px-2 py-1 inline-block">
        {coupon.code}
      </p>
      <p className="text-xs text-ink-soft mt-2 leading-relaxed">
        {coupon.minOrderTwd > 0 && `滿 ${formatTwd(coupon.minOrderTwd)}・`}
        {coupon.expiresAt
          ? `至 ${new Date(coupon.expiresAt).toLocaleDateString('zh-TW')}`
          : '不限期'}
      </p>
      {note && <p className="text-xs text-ink-soft mt-1">{note}</p>}
    </li>
  )
}
