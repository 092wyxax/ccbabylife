import { pgTable, uuid, text, integer, timestamp, boolean, jsonb, date, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { customers } from './customers'
import { products, productVariants } from './products'
import { adminUsers } from './admin_users'

export const orderStatusEnum = [
  'pending_payment',
  'paid',
  'sourcing_jp',
  'received_jp',
  'shipping_intl',
  'arrived_tw',
  'shipped',
  'completed',
  'cancelled',
  'refunded',
] as const
export type OrderStatus = (typeof orderStatusEnum)[number]

export const paymentMethodEnum = ['credit_card', 'atm', 'cvs', 'line_pay'] as const
export const paymentStatusEnum = ['pending', 'paid', 'failed', 'refunded'] as const

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    orderNumber: text('order_number').notNull().unique(),
    customerId: uuid('customer_id').notNull().references(() => customers.id),
    status: text('status', { enum: orderStatusEnum }).notNull().default('pending_payment'),
    paymentMethod: text('payment_method', { enum: paymentMethodEnum }),
    paymentStatus: text('payment_status', { enum: paymentStatusEnum }).notNull().default('pending'),
    subtotal: integer('subtotal').notNull(),
    shippingFee: integer('shipping_fee').notNull().default(0),
    tax: integer('tax').notNull().default(0),
    storeCreditUsed: integer('store_credit_used').notNull().default(0),
    couponCode: text('coupon_code'),
    couponDiscount: integer('coupon_discount').notNull().default(0),
    total: integer('total').notNull(),
    ecpayTradeNo: text('ecpay_trade_no').unique(),
    shippingAddress: jsonb('shipping_address').$type<{
      recipientName: string
      phone: string
      zipcode: string
      city: string
      address: string
    }>(),
    recipientLineId: text('recipient_line_id'),
    recipientEmail: text('recipient_email').notNull(),
    babyAgeMonths: integer('baby_age_months'),
    notes: text('notes'),
    trackingNumber: text('tracking_number'),
    shippingProvider: text('shipping_provider'),
    shippedAt: timestamp('shipped_at', { withTimezone: true }),
    isPreorder: boolean('is_preorder').notNull().default(true),
    expectedDelivery: date('expected_delivery'),
    cutoffDate: date('cutoff_date'),
    referredBy: uuid('referred_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('orders_org_idx').on(table.orgId),
    index('orders_customer_idx').on(table.customerId),
    index('orders_status_idx').on(table.status),
    index('orders_created_idx').on(table.createdAt),
  ]
)

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull().references(() => products.id),
    variantId: uuid('variant_id').references(() => productVariants.id),
    productNameSnapshot: text('product_name_snapshot').notNull(),
    priceTwdSnapshot: integer('price_twd_snapshot').notNull(),
    quantity: integer('quantity').notNull(),
    lineTotal: integer('line_total').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('order_items_order_idx').on(table.orderId)]
)

export const orderStatusLogs = pgTable(
  'order_status_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    fromStatus: text('from_status', { enum: orderStatusEnum }),
    toStatus: text('to_status', { enum: orderStatusEnum }).notNull(),
    actorId: uuid('actor_id').references(() => adminUsers.id),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('order_status_logs_order_idx').on(table.orderId)]
)

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
export type OrderItem = typeof orderItems.$inferSelect
export type OrderStatusLog = typeof orderStatusLogs.$inferSelect
