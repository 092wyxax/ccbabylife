import Link from 'next/link'
import { listPublishedPosts } from '@/server/services/JournalService'
import { imageUrl } from '@/lib/image'

export const metadata = {
  title: '日系選物筆記',
  description: '日系選物觀點、品牌觀察、媽媽真實使用心得。',
}

export default async function JournalPage() {
  const posts = await listPublishedPosts()

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <header className="mb-12">
        <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-3">JOURNAL · 雑記帖</p>
        <h1 className="font-serif text-3xl sm:text-4xl mb-3 tracking-wide">日系選物筆記</h1>
        <p className="text-ink-soft max-w-2xl leading-relaxed">
          選物觀點、日系品牌觀察、實際使用心得。不寫業配感重的文章。
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="py-16 text-center text-ink-soft border border-dashed border-line rounded-lg">
          還沒有文章。<Link href="/shop" className="underline hover:text-accent">先逛逛選物</Link>。
        </div>
      ) : (
        <ul className="space-y-12">
          {posts.map((p) => (
            <li
              key={p.id}
              className="grid sm:grid-cols-[200px_1fr] gap-6 pb-12 border-b border-line last:border-0"
            >
              {p.heroImage ? (
                <Link href={`/journal/${p.slug}`} className="aspect-video sm:aspect-square overflow-hidden rounded-md bg-cream-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl(p.heroImage)}
                    alt={p.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </Link>
              ) : (
                <div className="aspect-video sm:aspect-square bg-cream-100 rounded-md" />
              )}

              <div>
                {p.publishedAt && (
                  <p className="text-xs text-ink-soft mb-2">
                    {new Date(p.publishedAt).toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
                <h2 className="font-serif text-xl mb-2 hover:text-accent">
                  <Link href={`/journal/${p.slug}`}>{p.title}</Link>
                </h2>
                {p.excerpt && (
                  <p className="text-ink-soft text-sm leading-relaxed line-clamp-3">
                    {p.excerpt}
                  </p>
                )}
                <Link
                  href={`/journal/${p.slug}`}
                  className="inline-block mt-3 text-sm text-accent hover:underline font-jp"
                >
                  続きを読む · 繼續閱讀 →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
