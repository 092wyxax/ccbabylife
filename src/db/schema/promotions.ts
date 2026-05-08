import { pgTable, uuid, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { products } from './products'

/**
 * 滿額贈：當購物車總額 ≥ thresholdTwd 時自動把 giftProductId 加入訂單，金額為 0。
 *  - 可同時掛多筆（按 thresholdTwd 由小到大套用，但同一活動只贈一份）
 *  - quantity > 1 表示送多份
 *  - oneTimePerOrder=true：同一訂單最多贈一份；false 則達倍數可疊（不常見，保守預設 true）
 */
export const thresholdGifts = pgTable(
  'threshold_gifts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    name: text('name').notNull(),
    thresholdTwd: integer('threshold_twd').notNull(),
    giftProductId: uuid('gift_product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    isActive: boolean('is_active').notNull().default(true),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('threshold_gifts_org_idx').on(table.orgId),
    index('threshold_gifts_active_idx').on(table.isActive, table.thresholdTwd),
  ]
)

/**
 * 加購商品：購買 mainProductId 時，可在頁面上看到 addonProductId 的「加購價」。
 *  - 多筆加購挑同一支主商品 → 顯示為「加購商品」清單
 *  - addonPriceTwd 是加購當下的折讓價（NOT 折抵；直接以此價格進購物車）
 *  - 加購商品需求量上限 = main 的數量（每買 1 件主商品最多加購 1 件 addon × addonQty）
 */
export const productAddons = pgTable(
  'product_addons',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    mainProductId: uuid('main_product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    addonProductId: uuid('addon_product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    addonPriceTwd: integer('addon_price_twd').notNull(),
    maxAddonQty: integer('max_addon_qty').notNull().default(1),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('product_addons_main_idx').on(table.mainProductId, table.isActive),
  ]
)

export type ThresholdGift = typeof thresholdGifts.$inferSelect
export type NewThresholdGift = typeof thresholdGifts.$inferInsert
export type ProductAddon = typeof productAddons.$inferSelect
export type NewProductAddon = typeof productAddons.$inferInsert
