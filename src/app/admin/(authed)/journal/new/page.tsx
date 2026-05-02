import Link from 'next/link'
import { PostForm } from '@/components/admin/PostForm'
import { createPostAction } from '@/server/actions/journal'

export default function NewPostPage() {
  return (
    <div className="p-8 max-w-3xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/journal" className="hover:text-ink">部落格</Link>
        <span className="mx-2">/</span>
        <span>新增</span>
      </nav>
      <h1 className="font-serif text-2xl mb-1">新增文章</h1>
      <p className="text-ink-soft text-sm mb-8">
        建立後預設為「草稿」，確認內容後再切換為「已發布」。
      </p>
      <PostForm mode="create" action={createPostAction} />
    </div>
  )
}
