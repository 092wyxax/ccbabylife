import 'server-only'
import { and, asc, eq } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'
import { db } from '@/db/client'
import {
  adminUsers,
  type AdminUser,
  type AdminRole,
} from '@/db/schema/admin_users'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  return db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.orgId, DEFAULT_ORG_ID))
    .orderBy(asc(adminUsers.createdAt))
}

export async function createAdminUserWithSupabase(input: {
  email: string
  password: string
  name: string
  role: AdminRole
}): Promise<AdminUser> {
  const sb = supabaseAdmin()

  const { data: created, error } = await sb.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name: input.name },
  })

  let supabaseUserId: string
  if (error) {
    if (!error.message?.includes('already been registered')) {
      throw new Error(error.message)
    }
    const { data: list } = await sb.auth.admin.listUsers()
    const existing = list.users.find((u) => u.email === input.email)
    if (!existing) throw new Error('Could not find existing Supabase user')
    supabaseUserId = existing.id
  } else {
    supabaseUserId = created.user.id
  }

  const [row] = await db
    .insert(adminUsers)
    .values({
      orgId: DEFAULT_ORG_ID,
      supabaseUserId,
      email: input.email,
      name: input.name,
      role: input.role,
      mustChangePassword: true,
    })
    .onConflictDoUpdate({
      target: adminUsers.supabaseUserId,
      set: {
        name: input.name,
        role: input.role,
        email: input.email,
        mustChangePassword: true,
        updatedAt: new Date(),
      },
    })
    .returning()
  return row
}

export async function updateAdminRole(
  id: string,
  role: AdminRole
): Promise<AdminUser> {
  const [row] = await db
    .update(adminUsers)
    .set({ role, updatedAt: new Date() })
    .where(and(eq(adminUsers.id, id), eq(adminUsers.orgId, DEFAULT_ORG_ID)))
    .returning()
  if (!row) throw new Error(`Admin user not found: ${id}`)
  return row
}

export async function changeAdminPassword(
  adminId: string,
  supabaseUserId: string,
  newPassword: string
): Promise<void> {
  const sb = supabaseAdmin()
  const { error } = await sb.auth.admin.updateUserById(supabaseUserId, {
    password: newPassword,
  })
  if (error) throw new Error(error.message)

  await db
    .update(adminUsers)
    .set({ mustChangePassword: false, updatedAt: new Date() })
    .where(eq(adminUsers.id, adminId))
}

export async function deleteAdminUser(id: string): Promise<void> {
  const [existing] = await db
    .select()
    .from(adminUsers)
    .where(and(eq(adminUsers.id, id), eq(adminUsers.orgId, DEFAULT_ORG_ID)))
    .limit(1)
  if (!existing) return

  // Remove from Supabase Auth too
  const sb = supabaseAdmin()
  await sb.auth.admin.deleteUser(existing.supabaseUserId)

  await db.delete(adminUsers).where(eq(adminUsers.id, id))
}
