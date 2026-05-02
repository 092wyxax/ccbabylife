import 'server-only'
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { auditLogs, type AuditLog, type AuditActorType } from '@/db/schema/audit_logs'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { paged, type Paged, type PageParams } from '@/lib/pagination'

export interface AuditLogInput {
  actorType: AuditActorType
  actorId?: string | null
  actorLabel?: string | null
  action: string
  entityType: string
  entityId?: string | null
  data?: Record<string, unknown>
}

export async function recordAudit(input: AuditLogInput): Promise<void> {
  await db.insert(auditLogs).values({
    orgId: DEFAULT_ORG_ID,
    actorType: input.actorType,
    actorId: input.actorId ?? null,
    actorLabel: input.actorLabel ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    data: input.data ?? null,
  })
}

export async function listAuditLogs(opts: {
  search?: string
  entityType?: string
  page: PageParams
}): Promise<Paged<AuditLog>> {
  const conds = [eq(auditLogs.orgId, DEFAULT_ORG_ID)]
  if (opts.entityType) conds.push(eq(auditLogs.entityType, opts.entityType))
  if (opts.search) {
    const q = `%${opts.search}%`
    conds.push(
      or(
        ilike(auditLogs.action, q),
        ilike(auditLogs.entityType, q),
        ilike(auditLogs.actorLabel, q)
      )!
    )
  }
  const where = and(...conds)

  const [rows, totalRow] = await Promise.all([
    db
      .select()
      .from(auditLogs)
      .where(where)
      .orderBy(desc(auditLogs.createdAt))
      .limit(opts.page.pageSize)
      .offset(opts.page.offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(where),
  ])

  return paged(rows, totalRow[0]?.count ?? 0, opts.page)
}
