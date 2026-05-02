'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/server/services/AdminAuthService'
import {
  createAdminUserWithSupabase,
  updateAdminRole,
  deleteAdminUser,
} from '@/server/services/AdminUserService'
import { recordAudit } from '@/server/services/AuditService'
import { adminRoleEnum } from '@/db/schema'

export type AdminUserActionState = { error?: string; success?: string }

const createSchema = z.object({
  email: z.string().email('請填正確 email'),
  password: z.string().min(8, '密碼至少 8 字元'),
  name: z.string().min(1, '請填名稱'),
  role: z.enum(adminRoleEnum),
})

export async function createAdminUserAction(
  _prev: AdminUserActionState,
  formData: FormData
): Promise<AdminUserActionState> {
  const me = await requireAdmin()
  if (me.role !== 'owner') {
    return { error: '只有 owner 可以新增管理員' }
  }

  const parsed = createSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    name: formData.get('name'),
    role: formData.get('role'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }
  }

  try {
    const created = await createAdminUserWithSupabase(parsed.data)
    await recordAudit({
      actorType: 'admin',
      actorId: me.id,
      actorLabel: me.name,
      action: 'admin_user.create',
      entityType: 'admin_user',
      entityId: created.id,
      data: { email: created.email, role: created.role },
    })
    revalidatePath('/admin/admins')
    return { success: `已新增 ${created.name}（${created.role}）` }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

const roleSchema = z.object({ role: z.enum(adminRoleEnum) })

export async function updateAdminRoleAction(
  adminId: string,
  _prev: AdminUserActionState,
  formData: FormData
): Promise<AdminUserActionState> {
  const me = await requireAdmin()
  if (me.role !== 'owner') return { error: '只有 owner 可以變更角色' }
  if (me.id === adminId) return { error: '不能變更自己的角色' }

  const parsed = roleSchema.safeParse({ role: formData.get('role') })
  if (!parsed.success) return { error: '輸入錯誤' }

  await updateAdminRole(adminId, parsed.data.role)
  await recordAudit({
    actorType: 'admin',
    actorId: me.id,
    actorLabel: me.name,
    action: 'admin_user.update_role',
    entityType: 'admin_user',
    entityId: adminId,
    data: { role: parsed.data.role },
  })

  revalidatePath('/admin/admins')
  return { success: `角色已更新` }
}

export async function deleteAdminUserAction(adminId: string): Promise<void> {
  const me = await requireAdmin()
  if (me.role !== 'owner') throw new Error('只有 owner 可以刪除管理員')
  if (me.id === adminId) throw new Error('不能刪除自己')

  await deleteAdminUser(adminId)
  await recordAudit({
    actorType: 'admin',
    actorId: me.id,
    actorLabel: me.name,
    action: 'admin_user.delete',
    entityType: 'admin_user',
    entityId: adminId,
    data: {},
  })

  revalidatePath('/admin/admins')
}
