import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/server/services/AdminAuthService'
import type { AdminRole } from '@/db/schema'
import { AdminShell } from './AdminShell'

const NAV: Array<{ href: string; label: string; roles?: AdminRole[] }> = [
  { href: '/admin', label: '儀表板' },
  { href: '/admin/orders', label: '訂單', roles: ['owner', 'manager', 'ops', 'buyer'] },
  { href: '/admin/products', label: '商品', roles: ['owner', 'manager', 'ops', 'buyer'] },
  { href: '/admin/journal', label: '部落格', roles: ['owner', 'manager', 'editor'] },
  { href: '/admin/customers', label: '客戶', roles: ['owner', 'manager', 'ops'] },
  { href: '/admin/reviews', label: '評論', roles: ['owner', 'manager', 'ops'] },
  { href: '/admin/restock', label: '補貨通知', roles: ['owner', 'manager', 'ops'] },
  { href: '/admin/subscriptions', label: '訂閱', roles: ['owner', 'manager', 'ops'] },
  { href: '/admin/inventory', label: '庫存', roles: ['owner', 'manager', 'ops', 'buyer'] },
  { href: '/admin/purchases', label: '採購', roles: ['owner', 'manager', 'buyer'] },
  { href: '/admin/sources', label: '進貨來源', roles: ['owner', 'manager', 'buyer'] },
  { href: '/admin/marketing', label: '行銷', roles: ['owner', 'manager', 'editor'] },
  { href: '/admin/newsletter', label: '電子報', roles: ['owner', 'manager', 'editor'] },
  { href: '/admin/reports', label: '報表', roles: ['owner', 'manager'] },
  { href: '/admin/intelligence', label: '市場情報', roles: ['owner', 'manager', 'editor'] },
  { href: '/admin/experiments', label: 'A/B 測試', roles: ['owner', 'manager'] },
  { href: '/admin/audit-logs', label: '稽核紀錄', roles: ['owner', 'manager'] },
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
    case 'manager':
      return '經理'
    case 'ops':
      return '客服'
    case 'buyer':
      return '採購'
    case 'editor':
      return '編輯'
  }
}
