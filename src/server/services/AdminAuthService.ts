import 'server-only'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { adminUsers, type AdminUser, type AdminRole } from '@/db/schema/admin_users'
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
  if (!admin) return null
  if (admin.status === 'inactive') return null
  return admin
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    throw new Error('Not authenticated as admin')
  }
  return admin
}

/**
 * Page-level role guard. Redirects to /admin (dashboard) if the current
 * admin's role is not in the allowed list. Use at the top of restricted
 * page components.
 */
export async function requireRole(allowed: AdminRole[]): Promise<AdminUser> {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/admin/login')
  if (!allowed.includes(admin.role)) redirect('/admin')
  return admin
}
