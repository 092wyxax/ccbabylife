import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

/**
 * Master data for procurement (進貨設定). All tables here are user-editable
 * lookup lists used to populate dropdowns when creating purchase orders.
 *
 * Rate fields are stored as integer "basis points × 100" — i.e. percent × 100.
 *   12% → 1200
 *   0.04% → 4
 *   5% → 500
 * Display in UI: value / 100.
 */

export const taxRateGroups = pgTable(
  'tax_rate_groups',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    name: text('name').notNull(),
    /** 進口關稅率 — percent × 100, e.g. 12% = 1200 */
    importDutyRateBp: integer('import_duty_rate_bp').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('tax_rate_groups_org_idx').on(table.orgId)]
)

export const clearanceFeePlans = pgTable(
  'clearance_fee_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    name: text('name').notNull(),
    /** 報關雜支總額（每張採購單固定金額，新台幣）*/
    amountTwd: integer('amount_twd').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('clearance_fee_plans_org_idx').on(table.orgId)]
)

export const agentServicePlans = pgTable(
  'agent_service_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    name: text('name').notNull(),
    /** 基本方案費（每張採購單固定，新台幣）*/
    baseFeeTwd: integer('base_fee_twd').notNull().default(0),
    /** 手續費（每張採購單固定，新台幣）*/
    handlingFeeTwd: integer('handling_fee_twd').notNull().default(0),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('agent_service_plans_org_idx').on(table.orgId)]
)

export const paymentMethods = pgTable(
  'payment_methods',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    name: text('name').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('payment_methods_org_idx').on(table.orgId)]
)

export type TaxRateGroup = typeof taxRateGroups.$inferSelect
export type ClearanceFeePlan = typeof clearanceFeePlans.$inferSelect
export type AgentServicePlan = typeof agentServicePlans.$inferSelect
export type PaymentMethod = typeof paymentMethods.$inferSelect
