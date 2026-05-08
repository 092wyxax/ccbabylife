import { pgTable, uuid, text, integer, date, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    lineUserId: text('line_user_id').unique(),
    email: text('email').notNull(),
    name: text('name'),
    phone: text('phone'),
    babyBirthDate: date('baby_birth_date'),
    babyGender: text('baby_gender'),
    storeCredit: integer('store_credit').notNull().default(0),
    storeCreditExpire: timestamp('store_credit_expire', { withTimezone: true }),
    referralCode: text('referral_code').unique(),
    referredBy: uuid('referred_by'),
    totalSpent: integer('total_spent').notNull().default(0),
    totalOrders: integer('total_orders').notNull().default(0),
    tierId: uuid('tier_id'),
    tags: text('tags').array(),
    isBlacklisted: boolean('is_blacklisted').notNull().default(false),
    notificationPrefs: jsonb('notification_prefs')
      .$type<{ line: boolean; email: boolean }>()
      .notNull()
      .default({ line: true, email: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('customers_org_idx').on(table.orgId),
    index('customers_line_idx').on(table.lineUserId),
  ]
)

export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert
