import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/server/services/AdminAuthService'
import type { AdminRole } from '@/db/schema'
import { AdminShell } from './AdminShell'

const NAV: Array<{ href: string; label: string; roles?: AdminRole[] }> = [
  { href: '/admin', label: '儀表板' },
  { href: '/admin/orders', label: '訂單' },
  { href: '/admin/products', label: '商品' },
  { href: '/admin/journal', label: '部落格', roles: ['owner', 'admin'] },
  { href: '/admin/customers', label: '客戶', roles: ['owner', 'admin'] },
  { href: '/admin/reviews', label: '評論', roles: ['owner', 'admin'] },
  { href: '/admin/restock', label: '補貨通知', roles: ['owner', 'admin'] },
  { href: '/admin/subscriptions', label: '訂閱', roles: ['owner', 'admin'] },
  { href: '/admin/inventory', label: '庫存' },
  { href: '/admin/purchases', label: '採購', roles: ['owner', 'partner'] },
  { href: '/admin/sources', label: '進貨來源' },
  { href: '/admin/marketing', label: '行銷' },
  { href: '/admin/newsletter', label: '電子報', roles: ['owner', 'admin'] },
  { href: '/admin/reports', label: '報表', roles: ['owner', 'admin'] },
  { href: '/admin/intelligence', label: '市場情報' },
  { href: '/admin/experiments', label: 'A/B 測試', roles: ['owner', 'admin'] },
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
    <AdminShell
      admin={{ name: admin.name, email: admin.email, role: admin.role }}
      roleLabel={roleLabel(admin.role)}
      visibleNav={visibleNav.map((i) => ({ href: i.href, label: i.label }))}
    >
      {children}
    </AdminShell>
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
