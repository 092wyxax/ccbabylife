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
  updatedAt: Date | null
  updatedByEmail: string | null
}

/** 與 src/lib/pricing.ts 的常數一致；查無資料列時的預設值 */
const DEFAULTS: StoreSettings = {
  botRate: 0.225,
  freeShipThresholdTwd: 2000,
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
