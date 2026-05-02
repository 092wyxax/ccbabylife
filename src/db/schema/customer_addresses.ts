import { pgTable, uuid, text, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { customers } from './customers'

export const customerAddresses = pgTable(
  'customer_addresses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    recipientName: text('recipient_name').notNull(),
    phone: text('phone').notNull(),
    zipcode: text('zipcode').notNull(),
    city: text('city').notNull(),
    street: text('street').notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('cust_addr_customer_idx').on(table.customerId),
  ]
)

export type CustomerAddress = typeof customerAddresses.$inferSelect
export type NewCustomerAddress = typeof customerAddresses.$inferInsert
