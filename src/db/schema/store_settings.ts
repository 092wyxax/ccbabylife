import { pgTable, uuid, integer, numeric, timestamp, text } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

/**
 * 全店營運參數（設定中心）。一個 org 一列；查無資料時程式以
 * src/lib/pricing.ts 的常數為預設值，因此不需要 seed。
 */
export const storeSettings = pgTable('store_settings', {
  orgId: uuid('org_id')
    .primaryKey()
    .references(() => organizations.id),
  /** 台銀現金賣出匯率（JPY→TWD），乘上 BOT_BUFFER 後才是系統匯率 */
  botRate: numeric('bot_rate', { precision: 8, scale: 4 }).notNull().default('0.225'),
  /** 購物車滿額免運門檻（TWD） */
  freeShipThresholdTwd: integer('free_ship_threshold_twd').notNull().default(2000),
  /** 店家寫給 AI 小幫手的備忘（公司資訊、政策、口吻偏好），每次對話帶入 */
  aiNotes: text('ai_notes'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedByEmail: text('updated_by_email'),
})

export type StoreSettingsRow = typeof storeSettings.$inferSelect
