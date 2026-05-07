import Link from 'next/link'
import { sql, eq, count } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  orders,
  customers,
  products,
  pushLogs,
  adminUsers,
  posts,
} from '@/db/schema'
import { coupons } from '@/db/schema/coupons'
import { purchases } from '@/db/schema/purchases'
import { todos } from '@/db/schema/todos'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireRole } from '@/server/services/AdminAuthService'

export const dynamic = 'force-dynamic'

const ENV_KEYS = [
  // 必填類
  { key: 'NEXT_PUBLIC_SITE_URL', group: 'core', label: '網站網址', critical: true },
  { key: 'DATABASE_URL', group: 'core', label: 'Supabase 連線', critical: true },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', group: 'core', label: 'Supabase 服務金鑰', critical: true },
  { key: 'NEXT_PUBLIC_SUPABASE_URL', group: 'core', label: 'Supabase URL', critical: true },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', group: 'core', label: 'Supabase Anon Key', critical: true },
  { key: 'LINE_LOGIN_CHANNEL_ID', group: 'auth', label: 'LINE Login channel', critical: true },
  { key: 'LINE_LOGIN_CHANNEL_SECRET', group: 'auth', label: 'LINE Login secret', critical: true },
  { key: 'LINE_JWT_SECRET', group: 'auth', label: 'LINE JWT secret', critical: true },

  // 通知類
  { key: 'RESEND_API_KEY', group: 'notify', label: 'Resend (寄信)', critical: false },
  { key: 'EMAIL_FROM', group: 'notify', label: '寄件地址', critical: false },
  { key: 'LINE_MESSAGING_ACCESS_TOKEN', group: 'notify', label: 'LINE 推播', critical: false },
  { key: 'LINE_MESSAGING_CHANNEL_ID', group: 'notify', label: 'LINE Messaging ID', critical: false },
  { key: 'LINE_MESSAGING_CHANNEL_SECRET', group: 'notify', label: 'LINE Messaging secret', critical: false },

  // AI / 外部服務
  { key: 'ANTHROPIC_API_KEY', group: 'ai', label: 'Anthropic（自動建檔 AI）', critical: false },
  { key: 'OPENAI_API_KEY', group: 'ai', label: 'OpenAI', critical: false },
  { key: 'CF_ACCOUNT_ID', group: 'ai', label: 'Cloudflare Workers AI', critical: false },
  { key: 'CF_IMAGES_TOKEN', group: 'ai', label: 'Cloudflare token', critical: false },

  // 金流 / 物流
  { key: 'ECPAY_MERCHANT_ID', group: 'payment', label: '綠界商家 ID', critical: false },
  { key: 'ECPAY_HASH_KEY', group: 'payment', label: '綠界 Hash Key', critical: false },
  { key: 'ECPAY_HASH_IV', group: 'payment', label: '綠界 Hash IV', critical: false },
  { key: 'ECPAY_RETURN_URL', group: 'payment', label: '綠界 Return URL', critical: false },

  // 監控 / 安全
  { key: 'SENTRY_DSN', group: 'ops', label: 'Sentry DSN（伺服器端）', critical: false },
  { key: 'NEXT_PUBLIC_SENTRY_DSN', group: 'ops', label: 'Sentry DSN（client 端）', critical: false },
  { key: 'SENTRY_AUTH_TOKEN', group: 'ops', label: 'Sentry build token', critical: false },
  { key: 'SENTRY_ORG', group: 'ops', label: 'Sentry org slug', critical: false },
  { key: 'SENTRY_PROJECT', group: 'ops', label: 'Sentry project slug', critical: false },
  { key: 'NEXT_PUBLIC_TURNSTILE_SITE_KEY', group: 'ops', label: 'Cloudflare Turnstile', critical: false },
  { key: 'TURNSTILE_SECRET_KEY', group: 'ops', label: 'Turnstile secret', critical: false },
] as const

const GROUP_LABEL = {
  core: '核心服務',
  auth: '會員登入',
  notify: '通知（Email / LINE）',
  ai: 'AI / 外部服務',
  payment: '金流',
  ops: '監控 / 安全',
} as const

export default async function SystemHealthPage() {
  await requireRole(['owner', 'manager'])

  const dayAgo = sql`(now() - interval '24 hours')`
  const weekAgo = sql`(now() - interval '7 days')`

  const [
    [orderCounts],
    [customerCount],
    [productCount],
    [adminCount],
    [postCount],
    [couponCount],
    [purchaseCount],
    [todoOpen],
    [pushStats],
  ] = await Promise.all([
    db
      .select({
        total: count(),
        last24h: sql<number>`count(*) filter (where ${orders.createdAt} > ${dayAgo})::int`,
        last7d: sql<number>`count(*) filter (where ${orders.createdAt} > ${weekAgo})::int`,
        revenue7d: sql<number>`coalesce((sum(${orders.total}) filter (where ${orders.createdAt} > ${weekAgo} AND ${orders.status} not in ('cancelled', 'refunded', 'pending_payment')))::int, 0)`,
        pending: sql<number>`count(*) filter (where ${orders.status} = 'pending_payment')::int`,
      })
      .from(orders)
      .where(eq(orders.orgId, DEFAULT_ORG_ID)),
    db.select({ value: count() }).from(customers).where(eq(customers.orgId, DEFAULT_ORG_ID)),
    db.select({ value: count() }).from(products).where(eq(products.orgId, DEFAULT_ORG_ID)),
    db.select({ value: count() }).from(adminUsers).where(eq(adminUsers.orgId, DEFAULT_ORG_ID)),
    db.select({ value: count() }).from(posts).where(eq(posts.orgId, DEFAULT_ORG_ID)),
    db.select({ value: count() }).from(coupons).where(eq(coupons.orgId, DEFAULT_ORG_ID)),
    db.select({ value: count() }).from(purchases).where(eq(purchases.orgId, DEFAULT_ORG_ID)),
    db
      .select({ value: count() })
      .from(todos)
      .where(eq(todos.orgId, DEFAULT_ORG_ID)),
    db
      .select({
        queued: sql<number>`count(*) filter (where ${pushLogs.status} = 'queued')::int`,
        sent24h: sql<number>`count(*) filter (where ${pushLogs.status} = 'sent' AND ${pushLogs.createdAt} > ${dayAgo})::int`,
        failed24h: sql<number>`count(*) filter (where ${pushLogs.status} = 'failed' AND ${pushLogs.createdAt} > ${dayAgo})::int`,
        sent7d: sql<number>`count(*) filter (where ${pushLogs.status} = 'sent' AND ${pushLogs.createdAt} > ${weekAgo})::int`,
      })
      .from(pushLogs)
      .where(eq(pushLogs.orgId, DEFAULT_ORG_ID)),
  ])

  const envByGroup = ENV_KEYS.reduce<
    Record<string, Array<(typeof ENV_KEYS)[number] & { set: boolean }>>
  >((acc, e) => {
    const set = Boolean(process.env[e.key])
    const arr = acc[e.group] ?? []
    arr.push({ ...e, set })
    acc[e.group] = arr
    return acc
  }, {})

  const missingCritical = ENV_KEYS.filter(
    (e) => e.critical && !process.env[e.key]
  ).length
  const missingNonCritical = ENV_KEYS.filter(
    (e) => !e.critical && !process.env[e.key]
  ).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl space-y-8">
      <header>
        <h1 className="font-serif text-2xl mb-1">系統健康檢查</h1>
        <p className="text-ink-soft text-sm">
          後台運作狀態、資料量、環境變數設定一覽。即時 query。
        </p>
      </header>

      {/* 即時數字 */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
          資料 / 流量
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="會員總數" value={String(customerCount.value)} />
          <Stat label="商品總數" value={String(productCount.value)} />
          <Stat label="部落格篇數" value={String(postCount.value)} />
          <Stat label="優惠券" value={String(couponCount.value)} />
          <Stat label="進貨單" value={String(purchaseCount.value)} />
          <Stat label="管理員" value={String(adminCount.value)} />
          <Stat label="待辦中代辦" value={String(todoOpen.value)} />
          <Stat label="待付款訂單" value={String(orderCounts.pending ?? 0)} />
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-6">
        <div className="bg-white border border-line rounded-lg p-5">
          <h3 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
            訂單流量
          </h3>
          <Row label="累積總數" value={String(orderCounts.total)} />
          <Row label="近 24 小時新增" value={String(orderCounts.last24h ?? 0)} />
          <Row label="近 7 天新增" value={String(orderCounts.last7d ?? 0)} />
          <Row
            label="近 7 天有效營收"
            value={`NT$ ${(orderCounts.revenue7d ?? 0).toLocaleString()}`}
          />
        </div>

        <div className="bg-white border border-line rounded-lg p-5">
          <h3 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
            通知派送（push_logs）
          </h3>
          <Row
            label="排程中（queued）"
            value={String(pushStats?.queued ?? 0)}
            tone={pushStats?.queued && pushStats.queued > 0 ? 'warning' : undefined}
          />
          <Row label="近 24 小時寄出" value={String(pushStats?.sent24h ?? 0)} />
          <Row label="近 7 天寄出" value={String(pushStats?.sent7d ?? 0)} />
          <Row
            label="近 24 小時失敗"
            value={String(pushStats?.failed24h ?? 0)}
            tone={pushStats?.failed24h && pushStats.failed24h > 0 ? 'danger' : undefined}
          />
          <p className="text-xs text-ink-soft mt-3 leading-relaxed">
            排程中 = 等待 cron dispatch-pushes 跑（每日 21:00 台北）
          </p>
        </div>
      </section>

      {/* 環境變數狀態 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs uppercase tracking-widest text-ink-soft">
            環境變數設定狀態
          </h2>
          <span className="text-xs text-ink-soft">
            {missingCritical > 0 && (
              <span className="text-danger mr-2">
                {missingCritical} 個必要項目未設
              </span>
            )}
            {missingNonCritical > 0 && (
              <span className="text-ink-soft">
                {missingNonCritical} 個選用項目未設
              </span>
            )}
          </span>
        </div>

        <div className="space-y-4">
          {(Object.keys(envByGroup) as Array<keyof typeof GROUP_LABEL>).map((g) => (
            <div key={g} className="bg-white border border-line rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-cream-50 border-b border-line text-xs font-medium">
                {GROUP_LABEL[g]}
              </div>
              <ul className="divide-y divide-line text-sm">
                {envByGroup[g].map((e) => (
                  <li key={e.key} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs">{e.key}</p>
                      <p className="text-xs text-ink-soft">{e.label}</p>
                    </div>
                    {e.set ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-success/15 text-success whitespace-nowrap">
                        ✓ 已設
                      </span>
                    ) : (
                      <span
                        className={`text-xs px-2 py-0.5 rounded whitespace-nowrap ${
                          e.critical
                            ? 'bg-danger/15 text-danger'
                            : 'bg-ink-soft/15 text-ink-soft'
                        }`}
                      >
                        {e.critical ? '✗ 必填' : '— 選用'}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 外部監控連結 */}
      <section className="bg-cream-50 border border-line rounded-lg p-5 space-y-2 text-sm">
        <h3 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
          外部監控（依需要點開）
        </h3>
        <ul className="space-y-1.5 text-sm">
          <li>
            <ExtLink href="https://vercel.com/twsmartsectech-4047s-projects/ccbabylife/usage">
              Vercel Usage（頻寬 / Function 次數 / Image Optimization）
            </ExtLink>
          </li>
          <li>
            <ExtLink href="https://supabase.com/dashboard">
              Supabase Dashboard（DB 大小 / 流量 / 連線數）
            </ExtLink>
          </li>
          <li>
            <ExtLink href="https://resend.com/emails">
              Resend Logs（寄信成功率 / 退信）
            </ExtLink>
          </li>
          <li>
            <ExtLink href="https://sentry.io">
              Sentry 錯誤儀表板（須先填 SENTRY_DSN）
            </ExtLink>
          </li>
        </ul>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-line rounded-lg p-3">
      <p className="text-[10px] uppercase tracking-widest text-ink-soft mb-1">
        {label}
      </p>
      <p className="text-lg font-medium tabular-nums">{value}</p>
    </div>
  )
}

function Row({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'warning' | 'danger'
}) {
  const valueCls =
    tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-warning' : ''
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className={`font-medium tabular-nums ${valueCls}`}>{value}</span>
    </div>
  )
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent hover:underline"
    >
      {children} ↗
    </Link>
  )
}
