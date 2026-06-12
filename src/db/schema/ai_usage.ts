import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

/** 每次呼叫 DeepSeek 的 token 用量，供 AI 設定頁顯示本月花費估算 */
export const aiUsageLogs = pgTable(
  'ai_usage_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    /** 'chat'（後台對話）| 'inbox_draft'（收件匣草擬） */
    feature: text('feature').notNull(),
    inputTokens: integer('input_tokens').notNull().default(0),
    outputTokens: integer('output_tokens').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('ai_usage_org_created_idx').on(table.orgId, table.createdAt)]
)
