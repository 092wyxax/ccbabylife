import 'server-only'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { productReviews, type ProductReview } from '@/db/schema/reviews'
import { orderItems, orders } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

export async function listApprovedReviewsForProduct(
  productId: string
): Promise<ProductReview[]> {
  return db
    .select()
    .from(productReviews)
    .where(
      and(
        eq(productReviews.orgId, DEFAULT_ORG_ID),
        eq(productReviews.productId, productId),
        eq(productReviews.status, 'approved')
      )
    )
    .orderBy(desc(productReviews.createdAt))
}

export interface ProductReviewSummary {
  count: number
  average: number
}

export async function getProductReviewSummary(
  productId: string
): Promise<ProductReviewSummary> {
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
      avg: sql<number>`COALESCE(avg(${productReviews.rating}), 0)`,
    })
    .from(productReviews)
    .where(
      and(
        eq(productReviews.productId, productId),
        eq(productReviews.status, 'approved')
      )
    )
  return {
    count: row?.count ?? 0,
    average: Number(row?.avg ?? 0),
  }
}

export async function listAdminReviews(
  status?: ProductReview['status']
): Promise<Array<ProductReview & { productName: string | null }>> {
  const conds = [eq(productReviews.orgId, DEFAULT_ORG_ID)]
  if (status) conds.push(eq(productReviews.status, status))

  const rows = await db
    .select({
      review: productReviews,
      productName: sql<string | null>`(
        SELECT name_zh FROM products WHERE id = ${productReviews.productId}
      )`,
    })
    .from(productReviews)
    .where(and(...conds))
    .orderBy(desc(productReviews.createdAt))

  return rows.map((r) => ({ ...r.review, productName: r.productName }))
}

export async function isVerifiedBuyer(
  customerId: string,
  productId: string
): Promise<boolean> {
  const [row] = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(
      and(
        eq(orderItems.productId, productId),
        eq(orders.customerId, customerId),
        sql`${orders.status} not in ('cancelled', 'refunded', 'pending_payment')`
      )
    )
    .limit(1)
  return !!row
}

export async function createReview(input: {
  productId: string
  customerId: string | null
  rating: number
  title: string | null
  body: string
  isVerifiedBuyer: boolean
}): Promise<ProductReview> {
  const [row] = await db
    .insert(productReviews)
    .values({
      orgId: DEFAULT_ORG_ID,
      productId: input.productId,
      customerId: input.customerId,
      rating: input.rating,
      title: input.title,
      body: input.body,
      isVerifiedBuyer: input.isVerifiedBuyer,
      status: 'pending',
    })
    .returning()
  return row
}

export async function updateReviewStatus(
  reviewId: string,
  status: ProductReview['status']
): Promise<void> {
  await db
    .update(productReviews)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(productReviews.id, reviewId),
        eq(productReviews.orgId, DEFAULT_ORG_ID)
      )
    )
}
