import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { adminUsers, type AdminUser } from '@/db/schema/admin_users'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const admin = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.supabaseUserId, user.id),
  })
  return admin ?? null
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    throw new Error('Not authenticated as admin')
  }
  return admin
}
