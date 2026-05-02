import 'server-only'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { posts, type Post, type NewPost } from '@/db/schema/posts'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

export async function listPublishedPosts(): Promise<Post[]> {
  return db
    .select()
    .from(posts)
    .where(and(eq(posts.orgId, DEFAULT_ORG_ID), eq(posts.status, 'active')))
    .orderBy(desc(posts.publishedAt))
}

export async function listAllPostsForAdmin(): Promise<Post[]> {
  return db
    .select()
    .from(posts)
    .where(eq(posts.orgId, DEFAULT_ORG_ID))
    .orderBy(desc(posts.createdAt))
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const row = await db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.orgId, DEFAULT_ORG_ID),
        eq(posts.slug, slug),
        eq(posts.status, 'active')
      )
    )
    .limit(1)
  return row[0] ?? null
}

export async function getPostById(id: string): Promise<Post | null> {
  const row = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, id), eq(posts.orgId, DEFAULT_ORG_ID)))
    .limit(1)
  return row[0] ?? null
}

export type PostInput = Omit<
  NewPost,
  'id' | 'orgId' | 'createdAt' | 'updatedAt'
>

export async function createPost(input: PostInput): Promise<Post> {
  const [row] = await db
    .insert(posts)
    .values({
      ...input,
      orgId: DEFAULT_ORG_ID,
      publishedAt: input.status === 'active' ? new Date() : null,
    })
    .returning()
  return row
}

export async function updatePost(
  id: string,
  input: Partial<PostInput>
): Promise<Post> {
  const existing = await getPostById(id)
  if (!existing) throw new Error(`Post not found: ${id}`)

  const becomingActive =
    input.status === 'active' && existing.status !== 'active'

  const [row] = await db
    .update(posts)
    .set({
      ...input,
      updatedAt: new Date(),
      publishedAt: becomingActive ? new Date() : existing.publishedAt,
    })
    .where(and(eq(posts.id, id), eq(posts.orgId, DEFAULT_ORG_ID)))
    .returning()
  return row
}
