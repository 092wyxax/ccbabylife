'use client'

import { useActionState } from 'react'
import type { Post } from '@/db/schema'
import type { PostFormState } from '@/server/actions/journal'
import { imageUrl } from '@/lib/image'

interface Props {
  mode: 'create' | 'edit'
  post?: Post
  action: (prev: PostFormState, formData: FormData) => Promise<PostFormState>
}

const initialState: PostFormState = {}

export function PostForm({ mode, post, action }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const errs = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="space-y-6 max-w-3xl">
      {state.error && (
        <div className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
          {state.error}
        </div>
      )}

      <Input
        label="標題"
        name="title"
        required
        defaultValue={post?.title}
        error={errs.title}
      />
      <Input
        label="網址 slug"
        name="slug"
        required
        defaultValue={post?.slug}
        hint="例：my-1-year-old-baby-japan-favorites"
        error={errs.slug}
      />
      <Textarea
        label="摘要"
        name="excerpt"
        rows={2}
        defaultValue={post?.excerpt ?? ''}
        hint="顯示在列表頁與 SEO description"
        error={errs.excerpt}
      />
      <Textarea
        label="內文（Markdown）"
        name="body"
        rows={14}
        required
        defaultValue={post?.body ?? ''}
        hint="支援 Markdown：## 標題、**粗體**、*斜體*、- 條列、> 引用、[連結](url)、![alt](image url) 等"
        error={errs.body}
      />

      <div>
        <label className="block text-sm mb-1.5">封面圖片</label>
        {post?.heroImage && (
          <div className="mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl(post.heroImage)}
              alt=""
              className="w-48 aspect-video object-cover rounded-md border border-line"
            />
            <p className="text-xs text-ink-soft mt-1">目前封面 — 上傳新圖會取代</p>
          </div>
        )}
        <input
          type="file"
          name="heroImageFile"
          accept="image/*"
          className="block w-full text-sm text-ink-soft file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-ink file:text-cream hover:file:bg-accent file:cursor-pointer cursor-pointer"
        />
      </div>

      <div>
        <label className="block text-sm mb-1.5">
          狀態 <span className="text-danger">*</span>
        </label>
        <select
          name="status"
          required
          defaultValue={post?.status ?? 'draft'}
          className="w-full border border-line rounded-md px-3 py-2 bg-white"
        >
          <option value="draft">草稿（不對外）</option>
          <option value="active">已發布（前台可見）</option>
          <option value="archived">已封存</option>
        </select>
      </div>

      <div className="pt-4 border-t border-line">
        <button
          type="submit"
          disabled={pending}
          className="bg-ink text-cream px-6 py-2.5 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
        >
          {pending ? '儲存中⋯' : mode === 'create' ? '建立文章' : '儲存變更'}
        </button>
      </div>
    </form>
  )
}

interface FieldProps {
  label: string
  name: string
  defaultValue?: string
  hint?: string
  error?: string
  required?: boolean
}

function Input({ label, name, required, defaultValue, hint, error }: FieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm mb-1.5">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        required={required}
        defaultValue={defaultValue}
        className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
      />
      {hint && !error && <p className="text-xs text-ink-soft mt-1">{hint}</p>}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  )
}

function Textarea({
  label,
  name,
  rows = 3,
  required,
  defaultValue,
  hint,
  error,
}: FieldProps & { rows?: number }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm mb-1.5">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        required={required}
        defaultValue={defaultValue}
        className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink leading-relaxed font-mono text-sm"
      />
      {hint && !error && <p className="text-xs text-ink-soft mt-1">{hint}</p>}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  )
}
