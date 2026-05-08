import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

/**
 * Membership tiers (e.g. 銅卡 / 銀卡 / 金卡 / 白金).
 * - thresholdTwd: cumulative spending (NTD) to reach this tier.
 *   Tier with the *highest* threshold ≤ customer.totalSpent applies.
 * - perks (free-text JSON-ish bullet list rendered to customer)
 * - discountBp: % discount in basis points (e.g. 500 = 5%)
 * - freeShipMin: free-shipping threshold (NTD); 0 means always free
 * - birthdayBonus: extra store credit on birthday (NTD)
 */
export const memberTiers = pgTable(
  'member_tiers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    name: text('name').notNull(),
    nameJp: text('name_jp'),
    color: text('color'),
    thresholdTwd: integer('threshold_twd').notNull().default(0),
    discountBp: integer('discount_bp').notNull().default(0),
    freeShipMinTwd: integer('free_ship_min_twd'),
    birthdayBonusTwd: integer('birthday_bonus_twd').notNull().default(0),
    perks: text('perks'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('member_tiers_org_threshold_idx').on(table.orgId, table.thresholdTwd),
  ]
)

export type MemberTier = typeof memberTiers.$inferSelect
export type NewMemberTier = typeof memberTiers.$inferInsert
