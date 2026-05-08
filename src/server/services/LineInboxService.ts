import 'server-only'
import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { lineMessages, type LineMessage } from '@/db/schema/line_messages'
import { customers } from '@/db/schema/customers'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { pushText } from '@/lib/line-messaging'

export interface InboxThread {
  lineUserId: string
  lastMessage: string
  lastDirection: 'in' | 'out'
  lastAt: Date
  unreadCount: number
  customerName: string | null
  customerEmail: string | null
}

export async function listInboxThreads(limit = 100): Promise<InboxThread[]> {
  // Aggregate latest msg per lineUserId via a subquery
  const rows = await db.execute(sql`
    select
      m.line_user_id,
      m.text as last_message,
      m.direction as last_direction,
      m.created_at as last_at,
      coalesce(u.unread_count, 0) as unread_count,
      c.name as customer_name,
      c.email as customer_email
    from line_messages m
    inner join (
      select line_user_id, max(created_at) as max_at
      from line_messages
      where org_id = ${DEFAULT_ORG_ID}
      group by line_user_id
    ) latest on latest.line_user_id = m.line_user_id and latest.max_at = m.created_at
    left join (
      select line_user_id, count(*)::int as unread_count
      from line_messages
      where direction = 'in' and is_read = false and org_id = ${DEFAULT_ORG_ID}
      group by line_user_id
    ) u on u.line_user_id = m.line_user_id
    left join customers c on c.line_user_id = m.line_user_id and c.org_id = ${DEFAULT_ORG_ID}
    where m.org_id = ${DEFAULT_ORG_ID}
    order by m.created_at desc
    limit ${limit}
  `)

  return (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
    lineUserId: String(r.line_user_id),
    lastMessage: String(r.last_message ?? ''),
    lastDirection: r.last_direction as 'in' | 'out',
    lastAt: new Date(r.last_at as string),
    unreadCount: Number(r.unread_count ?? 0),
    customerName: (r.customer_name as string | null) ?? null,
    customerEmail: (r.customer_email as string | null) ?? null,
  }))
}

export async function getThreadMessages(
  lineUserId: string,
  limit = 100
): Promise<LineMessage[]> {
  const rows = await db
    .select()
    .from(lineMessages)
    .where(
      and(
        eq(lineMessages.orgId, DEFAULT_ORG_ID),
        eq(lineMessages.lineUserId, lineUserId)
      )
    )
    .orderBy(desc(lineMessages.createdAt))
    .limit(limit)
  return rows.reverse() // oldest first for chat display
}

export async function markThreadRead(lineUserId: string): Promise<void> {
  await db
    .update(lineMessages)
    .set({ isRead: true })
    .where(
      and(
        eq(lineMessages.orgId, DEFAULT_ORG_ID),
        eq(lineMessages.lineUserId, lineUserId),
        eq(lineMessages.direction, 'in'),
        eq(lineMessages.isRead, false)
      )
    )
}

export async function getCustomerByLineUserId(
  lineUserId: string
): Promise<{ id: string; name: string | null; email: string } | null> {
  const [row] = await db
    .select({ id: customers.id, name: customers.name, email: customers.email })
    .from(customers)
    .where(
      and(eq(customers.orgId, DEFAULT_ORG_ID), eq(customers.lineUserId, lineUserId))
    )
    .limit(1)
  return row ?? null
}

export async function sendReply(lineUserId: string, text: string): Promise<void> {
  if (!text.trim()) return
  await pushText(lineUserId, text)
  await db.insert(lineMessages).values({
    orgId: DEFAULT_ORG_ID,
    lineUserId,
    direction: 'out',
    type: 'text',
    text,
    isRead: true,
  })
}

export async function totalUnreadCount(): Promise<number> {
  const [r] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(lineMessages)
    .where(
      and(
        eq(lineMessages.orgId, DEFAULT_ORG_ID),
        eq(lineMessages.direction, 'in'),
        eq(lineMessages.isRead, false)
      )
    )
  return r?.c ?? 0
}
