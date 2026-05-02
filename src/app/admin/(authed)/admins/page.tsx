import { redirect } from 'next/navigation'
import { listAdminUsers } from '@/server/services/AdminUserService'
import { getCurrentAdmin } from '@/server/services/AdminAuthService'
import { AdminUserAddForm } from '@/components/admin/AdminUserAddForm'
import { deleteAdminUserAction } from '@/server/actions/admin-users'

export default async function AdminUsersPage() {
  const me = await getCurrentAdmin()
  if (!me || me.role !== 'owner') {
    redirect('/admin')
  }

  const admins = await listAdminUsers()

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="font-serif text-2xl mb-1">管理員</h1>
      <p className="text-ink-soft text-sm mb-8">
        管理後台帳號（owner / admin / partner）。只有 owner 能新增 / 刪除。
      </p>

      <section className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div>
          <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
            目前 {admins.length} 位管理員
          </h2>
          <div className="bg-white border border-line rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 text-ink-soft">
                <tr>
                  <th className="text-left px-4 py-3 font-normal">姓名 / Email</th>
                  <th className="text-left px-4 py-3 font-normal">角色</th>
                  <th className="text-left px-4 py-3 font-normal">建立日期</th>
                  <th className="text-right px-4 py-3 font-normal w-20"></th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id} className="border-t border-line">
                    <td className="px-4 py-3">
                      <p>{a.name}</p>
                      <p className="text-xs text-ink-soft mt-0.5">{a.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          'text-xs px-2 py-0.5 rounded-full ' +
                          (a.role === 'owner'
                            ? 'bg-accent/20 text-ink'
                            : a.role === 'admin'
                            ? 'bg-success/15 text-ink'
                            : 'bg-line text-ink')
                        }
                      >
                        {a.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft text-xs">
                      {new Date(a.createdAt).toLocaleDateString('zh-TW')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.id !== me.id && (
                        <form
                          action={async () => {
                            'use server'
                            await deleteAdminUserAction(a.id)
                          }}
                        >
                          <button
                            type="submit"
                            className="text-xs text-ink-soft hover:text-danger underline"
                          >
                            刪除
                          </button>
                        </form>
                      )}
                      {a.id === me.id && (
                        <span className="text-xs text-ink-soft">（你）</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside>
          <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
            新增管理員
          </h2>
          <AdminUserAddForm />
          <p className="text-xs text-ink-soft mt-4 leading-relaxed">
            新增後請把 email + 初始密碼私訊給對方。對方第一次登入後**請馬上提醒改密碼**。
          </p>
        </aside>
      </section>
    </div>
  )
}
