'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/server/services/AdminAuthService'
import { createPost, updatePost } from '@/server/services/JournalService'
import { uploadProductImage } from '@/lib/supabase/storage'
import { postStatusEnum } from '@/db/schema'

const postInputSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'slug 只能包含小寫英數與短橫線'),
  title: z.string().min(1, '請填標題'),
  excerpt: z.string().optional().or(z.literal('')),
  body: z.string().min(1, '請填內文'),
  status: z.enum(postStatusEnum),
})

export type PostFormState = {
  error?: string
  fieldErrors?: Record<string, string>
}

function parseFields(formData: FormData) {
  const fields = ['slug', 'title', 'excerpt', 'body', 'status']
  const obj: Record<string, string> = {}
  for (const f of fields) {
    const v = formData.get(f)
    if (typeof v === 'string') obj[f] = v
  }
  return obj
}

async function maybeUploadHero(
  formData: FormData,
  postId: string
): Promise<string | undefined> {
  const file = formData.get('heroImageFile')
  if (file instanceof File && file.size > 0) {
    return await uploadProductImage(`journal/${postId}`, file)
  }
  return undefined
}

export async function createPostAction(
  _prev: PostFormState,
  formData: FormData
): Promise<PostFormState> {
  await requireAdmin()
  const parsed = postInputSchema.safeParse(parseFields(formData))
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.')
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message
    }
    return { error: '輸入驗證失敗', fieldErrors }
  }

  let postId: string
  try {
    const post = await createPost({
      slug: parsed.data.slug,
      title: parsed.data.title,
      excerpt: parsed.data.excerpt || null,
      body: parsed.data.body,
      status: parsed.data.status,
      heroImage: null,
    })
    postId = post.id
    const heroPath = await maybeUploadHero(formData, postId)
    if (heroPath) {
      await updatePost(postId, { heroImage: heroPath })
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }

  revalidatePath('/admin/journal')
  revalidatePath('/journal')
  revalidatePath(`/journal/${parsed.data.slug}`)
  redirect(`/admin/journal/${postId}`)
}

export async function updatePostAction(
  postId: string,
  _prev: PostFormState,
  formData: FormData
): Promise<PostFormState> {
  await requireAdmin()
  const parsed = postInputSchema.safeParse(parseFields(formData))
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.')
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message
    }
    return { error: '輸入驗證失敗', fieldErrors }
  }

  try {
    const heroPath = await maybeUploadHero(formData, postId)
    await updatePost(postId, {
      slug: parsed.data.slug,
      title: parsed.data.title,
      excerpt: parsed.data.excerpt || null,
      body: parsed.data.body,
      status: parsed.data.status,
      ...(heroPath ? { heroImage: heroPath } : {}),
    })
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }

  revalidatePath('/admin/journal')
  revalidatePath('/journal')
  revalidatePath(`/journal/${parsed.data.slug}`)
  return {}
}
