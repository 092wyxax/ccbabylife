import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { storeSettings } from '@/db/schema/store_settings'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { recordAudit } from './AuditService'

export interface StoreSettings {
  /** 台銀現金賣出匯率（JPY→TWD） */
  botRate: number
  /** 滿額免運門檻（TWD） */
  freeShipThresholdTwd: number
  /** 店家寫給 AI 小幫手的備忘 */
  aiNotes: string | null
  updatedAt: Date | null
  updatedByEmail: string | null
}

/** 與 src/lib/pricing.ts 的常數一致；查無資料列時的預設值 */
const DEFAULTS: StoreSettings = {
  botRate: 0.225,
  freeShipThresholdTwd: 2000,
  aiNotes: null,
  updatedAt: null,
  updatedByEmail: null,
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const [row] = await db
    .select()
    .from(storeSettings)
    .where(eq(storeSettings.orgId, DEFAULT_ORG_ID))
    .limit(1)
  if (!row) return DEFAULTS
  return {
    botRate: Number(row.botRate),
    freeShipThresholdTwd: row.freeShipThresholdTwd,
    aiNotes: row.aiNotes,
    updatedAt: row.updatedAt,
    updatedByEmail: row.updatedByEmail,
  }
}

export interface UpdateStoreSettingsInput {
  botRate: number
  freeShipThresholdTwd: number
}

export async function updateStoreSettings(
  input: UpdateStoreSettingsInput,
  actor: { id: string; name: string; email: string }
): Promise<void> {
  const before = await getStoreSettings()
  await db
    .insert(storeSettings)
    .values({
      orgId: DEFAULT_ORG_ID,
      botRate: input.botRate.toFixed(4),
      freeShipThresholdTwd: input.freeShipThresholdTwd,
      updatedAt: new Date(),
      updatedByEmail: actor.email,
    })
    .onConflictDoUpdate({
      target: storeSettings.orgId,
      set: {
        botRate: input.botRate.toFixed(4),
        freeShipThresholdTwd: input.freeShipThresholdTwd,
        updatedAt: new Date(),
        updatedByEmail: actor.email,
      },
    })
  await recordAudit({
    actorType: 'admin',
    actorId: actor.id,
    actorLabel: actor.name,
    action: 'settings.update',
    entityType: 'store_settings',
    entityId: DEFAULT_ORG_ID,
    data: {
      before: { botRate: before.botRate, freeShipThresholdTwd: before.freeShipThresholdTwd },
      after: { botRate: input.botRate, freeShipThresholdTwd: input.freeShipThresholdTwd },
    },
  })
}

/** AI 備忘獨立更新（開放店主＋經理；營運參數仍僅店主） */
export async function updateAiNotes(
  aiNotes: string,
  actor: { id: string; name: string; email: string }
): Promise<void> {
  const trimmed = aiNotes.trim() || null
  await db
    .insert(storeSettings)
    .values({
      orgId: DEFAULT_ORG_ID,
      aiNotes: trimmed,
      updatedAt: new Date(),
      updatedByEmail: actor.email,
    })
    .onConflictDoUpdate({
      target: storeSettings.orgId,
      set: {
        aiNotes: trimmed,
        updatedAt: new Date(),
        updatedByEmail: actor.email,
      },
    })
  await recordAudit({
    actorType: 'admin',
    actorId: actor.id,
    actorLabel: actor.name,
    action: 'settings.ai_notes.update',
    entityType: 'store_settings',
    entityId: DEFAULT_ORG_ID,
    data: { length: trimmed?.length ?? 0 },
  })
}
