import 'server-only'
import { and, eq, gte, lte, isNotNull, or } from 'drizzle-orm'
import { db } from '@/db/client'
import { purchases } from '@/db/schema/purchases'
import { orders } from '@/db/schema/orders'
import { coupons } from '@/db/schema/coupons'
import { posts } from '@/db/schema/posts'
import { todos } from '@/db/schema/todos'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import type { CalendarEvent, CalendarEventType } from '@/lib/calendar-types'

export type { CalendarEvent, CalendarEventType } from '@/lib/calendar-types'
export { CALENDAR_TYPE_LABEL, CALENDAR_TYPE_COLOR } from '@/lib/calendar-types'

interface FetchOptions {
  from: Date
  to: Date
  /** If provided, only include these types */
  types?: CalendarEventType[]
  /** Current admin (for personal todo visibility) */
  adminId: string
  adminRole: string
}

const TPE_OFFSET_MIN = 8 * 60 // Asia/Taipei = UTC+8

function toTaipeiDateStr(d: Date | string | null | undefined): string | null {
  if (!d) return null
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return null
  const tpe = new Date(date.getTime() + TPE_OFFSET_MIN * 60 * 1000)
  return tpe.toISOString().slice(0, 10)
}

const wantedSet = (types: CalendarEventType[] | undefined): Set<CalendarEventType> | null =>
  types && types.length > 0 ? new Set(types) : null

export async function getCalendarEvents(opts: FetchOptions): Promise<CalendarEvent[]> {
  const wanted = wantedSet(opts.types)
  const want = (t: CalendarEventType) => !wanted || wanted.has(t)

  const events: CalendarEvent[] = []

  // ── Purchases ────────────────────────────────────
  if (want('purchase')) {
    const rows = await db
      .select({
        id: purchases.id,
        batchLabel: purchases.batchLabel,
        purchaseDate: purchases.purchaseDate,
        submittedAt: purchases.submittedAt,
        receivedAt: purchases.receivedAt,
        completedAt: purchases.completedAt,
      })
      .from(purchases)
      .where(eq(purchases.orgId, DEFAULT_ORG_ID))

    for (const p of rows) {
      const url = `/admin/purchases/${p.id}`
      const pairs: Array<[Date | string | null, string]> = [
        [p.purchaseDate, '排定進貨'],
        [p.submittedAt, '已下單'],
        [p.receivedAt, '日本到貨'],
        [p.completedAt, '完成'],
      ]
      for (const [d, label] of pairs) {
        const date = toTaipeiDateStr(d)
        if (!date) continue
        if (date < toTaipeiDateStr(opts.from)! || date > toTaipeiDateStr(opts.to)!) continue
        events.push({
          date,
          type: 'purchase',
          subType: label,
          title: `${label} · ${p.batchLabel}`,
          refUrl: url,
          sourceId: `purchase-${p.id}-${label}`,
        })
      }
    }
  }

  // ── Orders ───────────────────────────────────────
  if (want('order')) {
    const rows = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        createdAt: orders.createdAt,
        cutoffDate: orders.cutoffDate,
      })
      .from(orders)
      .where(
        and(
          eq(orders.orgId, DEFAULT_ORG_ID),
          or(
            and(gte(orders.createdAt, opts.from), lte(orders.createdAt, opts.to)),
            and(
              isNotNull(orders.cutoffDate),
              gte(orders.cutoffDate, toTaipeiDateStr(opts.from)!),
              lte(orders.cutoffDate, toTaipeiDateStr(opts.to)!)
            )
          )
        )
      )

    for (const o of rows) {
      const placedDate = toTaipeiDateStr(o.createdAt)
      if (placedDate) {
        events.push({
          date: placedDate,
          type: 'order',
          subType: '下單',
          title: `下單 · ${o.orderNumber}`,
          refUrl: `/admin/orders/${o.id}`,
          sourceId: `order-${o.id}-placed`,
        })
      }
      const cutoffDate = toTaipeiDateStr(o.cutoffDate)
      if (cutoffDate) {
        events.push({
          date: cutoffDate,
          type: 'order',
          subType: '截單',
          title: `截單 · ${o.orderNumber}`,
          refUrl: `/admin/orders/${o.id}`,
          sourceId: `order-${o.id}-cutoff`,
        })
      }
    }
  }

  // ── Coupons ──────────────────────────────────────
  if (want('coupon')) {
    const rows = await db
      .select({
        id: coupons.id,
        code: coupons.code,
        startsAt: coupons.startsAt,
        expiresAt: coupons.expiresAt,
      })
      .from(coupons)
      .where(eq(coupons.orgId, DEFAULT_ORG_ID))

    for (const c of rows) {
      const url = `/admin/marketing/coupons/${c.id}`
      const startDate = toTaipeiDateStr(c.startsAt)
      const endDate = toTaipeiDateStr(c.expiresAt)
      const fromStr = toTaipeiDateStr(opts.from)!
      const toStr = toTaipeiDateStr(opts.to)!
      if (startDate && startDate >= fromStr && startDate <= toStr) {
        events.push({
          date: startDate,
          type: 'coupon',
          subType: '生效',
          title: `生效 · ${c.code}`,
          refUrl: url,
          sourceId: `coupon-${c.id}-start`,
        })
      }
      if (endDate && endDate >= fromStr && endDate <= toStr) {
        events.push({
          date: endDate,
          type: 'coupon',
          subType: '到期',
          title: `到期 · ${c.code}`,
          refUrl: url,
          sourceId: `coupon-${c.id}-end`,
        })
      }
    }
  }

  // ── Posts ────────────────────────────────────────
  if (want('post')) {
    const rows = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(
        and(
          eq(posts.orgId, DEFAULT_ORG_ID),
          isNotNull(posts.publishedAt),
          gte(posts.publishedAt, opts.from),
          lte(posts.publishedAt, opts.to)
        )
      )
    for (const p of rows) {
      const date = toTaipeiDateStr(p.publishedAt)
      if (!date) continue
      events.push({
        date,
        type: 'post',
        subType: '發文',
        title: `發文 · ${p.title}`,
        refUrl: `/admin/journal/${p.id}`,
        sourceId: `post-${p.id}`,
      })
    }
  }

  // ── Todos (visibility = shared OR self-assigned OR own; managers see all) ──
  if (want('todo')) {
    const isManager = opts.adminRole === 'owner' || opts.adminRole === 'manager'
    const todoRows = await db
      .select({
        id: todos.id,
        title: todos.title,
        dueAt: todos.dueAt,
        status: todos.status,
        priority: todos.priority,
        isShared: todos.isShared,
      })
      .from(todos)
      .where(
        and(
          eq(todos.orgId, DEFAULT_ORG_ID),
          isNotNull(todos.dueAt),
          gte(todos.dueAt, opts.from),
          lte(todos.dueAt, opts.to),
          isManager
            ? undefined
            : or(
                eq(todos.isShared, true),
                eq(todos.assigneeId, opts.adminId),
                eq(todos.createdById, opts.adminId)
              )
        )
      )
    for (const t of todoRows) {
      const date = toTaipeiDateStr(t.dueAt)
      if (!date) continue
      events.push({
        date,
        type: 'todo',
        subType: t.status === 'done' ? '已完成' : t.isShared ? '共用' : '個人',
        title: t.title,
        refUrl: `/admin/calendar/todos/${t.id}`,
        sourceId: `todo-${t.id}`,
      })
    }
  }

  // ── Cron schedules (constants) ───────────────────
  if (want('cron')) {
    const fromStr = toTaipeiDateStr(opts.from)!
    const toStr = toTaipeiDateStr(opts.to)!
    const cronEntries: Array<{ rule: 'daily' | 'weekly-wed'; hourTpe: number; label: string }> = [
      { rule: 'daily', hourTpe: 9, label: '寶寶月齡推送' }, // 1 AM UTC = 9 AM TPE
      { rule: 'daily', hourTpe: 21, label: '推播派送' }, // 13 UTC = 21 TPE
      { rule: 'weekly-wed', hourTpe: 4, label: '抓樂天熱門' }, // Wed 20 UTC = Thu 4 AM TPE → simplify to weekly Wed
    ]
    const cur = new Date(opts.from)
    const end = new Date(opts.to)
    while (cur <= end) {
      const dateStr = toTaipeiDateStr(cur)!
      if (dateStr >= fromStr && dateStr <= toStr) {
        const dayOfWeek = new Date(dateStr + 'T00:00:00').getUTCDay()
        for (const c of cronEntries) {
          const fires =
            c.rule === 'daily' ||
            (c.rule === 'weekly-wed' && dayOfWeek === 3)
          if (fires) {
            events.push({
              date: dateStr,
              type: 'cron',
              subType: '排程',
              title: c.label,
              refUrl: null,
              sourceId: `cron-${dateStr}-${c.label}`,
            })
          }
        }
      }
      cur.setUTCDate(cur.getUTCDate() + 1)
    }
  }

  // Sort: date asc, type stable order
  const typeOrder: Record<CalendarEventType, number> = {
    todo: 0,
    purchase: 1,
    order: 2,
    coupon: 3,
    post: 4,
    cron: 5,
  }
  events.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    return typeOrder[a.type] - typeOrder[b.type]
  })

  return events
}

/** List todos visible to the given admin, sorted for the inline list. */
export async function listVisibleTodos(adminId: string, adminRole: string) {
  const isManager = adminRole === 'owner' || adminRole === 'manager'
  return db
    .select()
    .from(todos)
    .where(
      and(
        eq(todos.orgId, DEFAULT_ORG_ID),
        isManager
          ? undefined
          : or(
              eq(todos.isShared, true),
              eq(todos.assigneeId, adminId),
              eq(todos.createdById, adminId)
            )
      )
    )
}

