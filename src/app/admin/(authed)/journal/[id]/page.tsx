import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPostById } from '@/server/services/JournalService'
import { updatePostAction, type PostFormState } from '@/server/actions/journal'
import { PostForm } from '@/components/admin/PostForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params
  const post = await getPostById(id)
  if (!post) notFound()

  const boundUpdate = async (
    prev: PostFormState,
    formData: FormData
  ): Promise<PostFormState> => {
    'use server'
    return updatePostAction(id, prev, formData)
  }

  return (
    <div className="p-8 max-w-3xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/journal" className="hover:text-ink">部落格</Link>
        <span className="mx-2">/</span>
        <span>{post.title}</span>
      </nav>

      <div className="flex items-start justify-between mb-6 pb-4 border-b border-line">
        <div>
          <h1 className="font-serif text-2xl mb-1">{post.title}</h1>
          <p className="text-ink-soft text-sm">
            slug: {post.slug}
            {post.status === 'active' && (
              <>
                {' · '}
                <Link
                  href={`/journal/${post.slug}`}
                  target="_blank"
                  className="underline hover:text-accent"
                >
                  在前台查看
                </Link>
              </>
            )}
          </p>
        </div>
      </div>

      <PostForm mode="edit" post={post} action={boundUpdate} />
    </div>
  )
}
