import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPostBySlug } from '@/server/services/JournalService'
import { imageUrl } from '@/lib/image'
import { renderMarkdown } from '@/lib/markdown'
import { articleLd, breadcrumbLd, jsonLdScript } from '@/lib/jsonld'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: '文章不存在' }
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
  }
}

export default async function JournalDetailPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const ldArticle = articleLd({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    heroImageUrl: post.heroImage ? imageUrl(post.heroImage) : null,
  })
  const crumbs = breadcrumbLd([
    { name: '首頁', href: '/' },
    { name: '部落格', href: '/journal' },
    { name: post.title, href: `/journal/${post.slug}` },
  ])

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(ldArticle) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }}
      />
      <nav className="text-xs text-ink-soft mb-6">
        <Link href="/journal" className="hover:text-ink">娃媽真心話</Link>
      </nav>

      <header className="mb-8">
        {post.publishedAt && (
          <p className="font-jp text-xs text-ink-soft mb-3 tracking-[0.3em]">
            {new Date(post.publishedAt).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        )}
        <h1 className="font-serif text-3xl sm:text-4xl leading-tight mb-4 tracking-wide">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="text-ink-soft text-lg leading-relaxed">{post.excerpt}</p>
        )}
      </header>

      {post.heroImage && (
        <div className="aspect-video rounded-lg overflow-hidden bg-cream-100 mb-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl(post.heroImage)}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div
        className="prose prose-stone max-w-none journal-body"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
      />

      <div className="mt-16 pt-8 border-t border-line text-sm text-ink-soft">
        <Link href="/journal" className="hover:text-accent font-jp">
          ← 一覧へ戻る · 回部落格
        </Link>
      </div>
    </article>
  )
}
