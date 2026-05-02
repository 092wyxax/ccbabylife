import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentAdmin } from '@/server/services/AdminAuthService'
import { logoutAction } from '@/server/actions/auth'
import type { AdminRole } from '@/db/schema'

const NAV: Array<{ href: string; label: string; roles?: AdminRole[] }> = [
  { href: '/admin', label: '儀表板' },
  { href: '/admin/orders', label: '訂單' },
  { href: '/admin/products', label: '商品' },
  { href: '/admin/journal', label: '部落格', roles: ['owner', 'admin'] },
  { href: '/admin/customers', label: '客戶', roles: ['owner', 'admin'] },
  { href: '/admin/inventory', label: '庫存' },
  { href: '/admin/purchases', label: '採購', roles: ['owner', 'partner'] },
  { href: '/admin/marketing', label: '行銷' },
  { href: '/admin/newsletter', label: '電子報', roles: ['owner', 'admin'] },
  { href: '/admin/intelligence', label: '市場情報' },
  { href: '/admin/audit-logs', label: '稽核紀錄', roles: ['owner', 'admin'] },
  { href: '/admin/admins', label: '管理員', roles: ['owner'] },
  { href: '/admin/settings', label: '設定', roles: ['owner'] },
]

export default async function AuthedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await getCurrentAdmin()
  if (!admin) {
    redirect('/admin/login')
  }

  const visibleNav = NAV.filter(
    (item) => !item.roles || item.roles.includes(admin.role)
  )

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <aside className="w-56 bg-white border-r border-line flex flex-col">
        <div className="p-6 border-b border-line">
          <Link href="/admin" className="font-serif text-lg">
            日系選物店
          </Link>
          <p className="text-xs text-ink-soft mt-1">後台</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 text-sm">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-md hover:bg-cream-100 text-ink-soft hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-line text-xs">
          <p className="text-ink-soft mb-1">登入身份</p>
          <p className="font-medium">{admin.name}</p>
          <p className="text-ink-soft mb-3">
            {admin.email} · {roleLabel(admin.role)}
          </p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-ink-soft hover:text-danger underline"
            >
              登出
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

function roleLabel(role: AdminRole): string {
  switch (role) {
    case 'owner':
      return '店主'
    case 'admin':
      return '管理員'
    case 'partner':
      return '合夥人'
  }
}
