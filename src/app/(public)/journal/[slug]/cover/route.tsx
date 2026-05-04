import { ImageResponse } from 'next/og'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { posts } from '@/db/schema/posts'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

export const revalidate = 3600

const SLUG_ICON: Record<string, string> = {
  'why-preorder-not-stock': '📦',
  'newborn-0-3-months-essentials': '👶',
  'pricing-formula-transparent': '💴',
  'pigeon-bottle-6-months-review': '🍼',
  'gauze-cloth-5-brands-test': '🧺',
  'why-no-baby-formula': '⚠️',
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const [post] = await db
    .select({ title: posts.title })
    .from(posts)
    .where(and(eq(posts.orgId, DEFAULT_ORG_ID), eq(posts.slug, slug)))
    .limit(1)

  const title = post?.title ?? 'JOURNAL'
  const icon = SLUG_ICON[slug] ?? '·'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#faf7f2',
          color: '#2d2a26',
          display: 'flex',
          flexDirection: 'column',
          padding: '80px',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 60,
            right: 60,
            width: 110,
            height: 110,
            borderRadius: '50%',
            background: '#F5EFE6',
            border: '2px solid #2d2a26',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 72,
            fontWeight: 700,
            color: '#2d2a26',
          }}
        >
          初
        </div>

        <div style={{ fontSize: 22, letterSpacing: 8, color: '#7a756f' }}>
          JOURNAL · 雜記
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ fontSize: 96, marginBottom: 24 }}>{icon}</div>

        <div
          style={{
            fontSize: 56,
            lineHeight: 1.3,
            fontWeight: 700,
            maxWidth: 980,
            display: 'flex',
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 20,
            color: '#7a756f',
            marginTop: 28,
            letterSpacing: 4,
          }}
        >
          熙熙初日 · 日系選物店
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
