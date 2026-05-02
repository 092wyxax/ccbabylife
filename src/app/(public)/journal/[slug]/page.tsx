import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPostBySlug } from '@/server/services/JournalService'
import { imageUrl } from '@/lib/image'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: '文章不存在 | 日系選物店' }
  return {
    title: `${post.title} | 日系選物店`,
    description: post.excerpt ?? undefined,
  }
}

export default async function JournalDetailPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <nav className="text-xs text-ink-soft mb-6">
        <Link href="/journal" className="hover:text-ink">娃媽真心話</Link>
      </nav>

      <header className="mb-8">
        {post.publishedAt && (
          <p className="text-xs text-ink-soft mb-3 uppercase tracking-widest">
            {new Date(post.publishedAt).toLocaleDateString('zh-TW', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        )}
        <h1 className="font-serif text-3xl sm:text-4xl leading-tight mb-4">
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

      <div className="prose prose-stone max-w-none">
        <p className="whitespace-pre-wrap leading-loose text-ink/90">
          {post.body}
        </p>
      </div>

      <div className="mt-16 pt-8 border-t border-line text-sm text-ink-soft">
        <Link href="/journal" className="hover:text-accent">
          ← 回部落格
        </Link>
      </div>
    </article>
  )
}
