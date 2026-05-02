import { pgTable, uuid, text, integer, timestamp, boolean, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const productStockTypeEnum = ['preorder', 'in_stock'] as const
export const productStatusEnum = ['draft', 'active', 'archived'] as const
export const sourcePlatformEnum = ['rakuten', 'amazon_jp', 'zozo', 'other'] as const

export const brands = pgTable(
  'brands',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    slug: text('slug').notNull(),
    nameZh: text('name_zh').notNull(),
    nameJp: text('name_jp'),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('brands_org_idx').on(table.orgId)]
)

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    parentId: uuid('parent_id'),
    minAgeMonths: integer('min_age_months'),
    maxAgeMonths: integer('max_age_months'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('categories_org_idx').on(table.orgId)]
)

export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    slug: text('slug').notNull(),
    nameZh: text('name_zh').notNull(),
    nameJp: text('name_jp'),
    brandId: uuid('brand_id').references(() => brands.id),
    categoryId: uuid('category_id').references(() => categories.id),
    description: text('description'),
    useExperience: text('use_experience'),
    minAgeMonths: integer('min_age_months'),
    maxAgeMonths: integer('max_age_months'),
    priceJpy: integer('price_jpy').notNull(),
    priceTwd: integer('price_twd').notNull(),
    costJpy: integer('cost_jpy'),
    weightG: integer('weight_g').notNull(),
    stockType: text('stock_type', { enum: productStockTypeEnum }).notNull().default('preorder'),
    stockQuantity: integer('stock_quantity').notNull().default(0),
    status: text('status', { enum: productStatusEnum }).notNull().default('draft'),
    sourceUrl: text('source_url'),
    sourcePlatform: text('source_platform', { enum: sourcePlatformEnum }),
    legalCheckPassed: boolean('legal_check_passed').notNull().default(false),
    legalNotes: text('legal_notes'),
    tags: text('tags').array(),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    viewCount: integer('view_count').notNull().default(0),
    salesCount: integer('sales_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('products_org_idx').on(table.orgId),
    index('products_slug_idx').on(table.slug),
    index('products_status_idx').on(table.status),
  ]
)

export const productImages = pgTable(
  'product_images',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    cfImageId: text('cf_image_id').notNull(),
    altText: text('alt_text'),
    sortOrder: integer('sort_order').notNull().default(0),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('product_images_product_idx').on(table.productId)]
)

export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    sku: text('sku').notNull(),
    name: text('name').notNull(),
    priceTwdOverride: integer('price_twd_override'),
    stockQuantity: integer('stock_quantity').notNull().default(0),
    weightGOverride: integer('weight_g_override'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('product_variants_product_idx').on(table.productId)]
)

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type ProductImage = typeof productImages.$inferSelect
export type ProductVariant = typeof productVariants.$inferSelect
export type Brand = typeof brands.$inferSelect
export type Category = typeof categories.$inferSelect
