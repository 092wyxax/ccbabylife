'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getCurrentAdmin } from '@/server/services/AdminAuthService'
import { changeAdminPassword } from '@/server/services/AdminUserService'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const schema = z
  .object({
    password: z.string().min(8, '密碼至少 8 字元'),
    confirm: z.string().min(8),
  })
  .refine((d) => d.password === d.confirm, {
    message: '兩次密碼不一致',
    path: ['confirm'],
  })

export type ChangePasswordState = { error?: string; success?: boolean }

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const me = await getCurrentAdmin()
  if (!me) {
    redirect('/admin/login')
  }

  const parsed = schema.safeParse({
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  }

  try {
    await changeAdminPassword(me.id, me.supabaseUserId, parsed.data.password)
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }

  // Refresh Supabase session so new password takes effect immediately.
  const sb = await createSupabaseServerClient()
  await sb.auth.refreshSession()

  redirect('/admin')
}
