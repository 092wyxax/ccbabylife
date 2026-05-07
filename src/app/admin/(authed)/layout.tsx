import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/server/services/AdminAuthService'
import type { AdminRole } from '@/db/schema'
import { AdminShell } from './AdminShell'

type NavItem = { href: string; label: string; roles?: AdminRole[] }
type NavGroup = { label: string; items: NavItem[] }

const NAV: NavGroup[] = [
  {
    label: '總覽',
    items: [{ href: '/admin', label: '儀表板' }],
  },
  {
    label: '訂單與客戶',
    items: [
      { href: '/admin/orders', label: '訂單', roles: ['owner', 'manager', 'ops', 'buyer'] },
      { href: '/admin/customers', label: '客戶', roles: ['owner', 'manager', 'ops'] },
      { href: '/admin/reviews', label: '評論', roles: ['owner', 'manager', 'ops'] },
      { href: '/admin/restock', label: '補貨通知', roles: ['owner', 'manager', 'ops'] },
      { href: '/admin/subscriptions', label: '訂閱', roles: ['owner', 'manager', 'ops'] },
    ],
  },
  {
    label: '商品與庫存',
    items: [
      { href: '/admin/products', label: '商品', roles: ['owner', 'manager', 'ops', 'buyer'] },
      { href: '/admin/inventory', label: '庫存', roles: ['owner', 'manager', 'ops', 'buyer'] },
      { href: '/admin/purchases', label: '進貨單', roles: ['owner', 'manager', 'buyer'] },
      { href: '/admin/sources', label: '採購商', roles: ['owner', 'manager', 'buyer'] },
      { href: '/admin/procurement-settings', label: '進貨設定', roles: ['owner', 'manager', 'buyer'] },
    ],
  },
  {
    label: '行銷與內容',
    items: [
      { href: '/admin/journal', label: '部落格', roles: ['owner', 'manager', 'editor'] },
      { href: '/admin/marketing', label: '行銷活動', roles: ['owner', 'manager', 'editor'] },
      { href: '/admin/newsletter', label: '電子報', roles: ['owner', 'manager', 'editor'] },
      { href: '/admin/experiments', label: 'A/B 測試', roles: ['owner', 'manager'] },
    ],
  },
  {
    label: '數據分析',
    items: [
      { href: '/admin/reports', label: '報表', roles: ['owner', 'manager'] },
      { href: '/admin/intelligence', label: '市場情報', roles: ['owner', 'manager', 'editor'] },
    ],
  },
  {
    label: '內部協作',
    items: [
      { href: '/admin/calendar', label: '行事曆 / 待辦' },
      { href: '/admin/board', label: '公告留言板' },
    ],
  },
  {
    label: '系統管理',
    items: [
      { href: '/admin/admins', label: '管理員', roles: ['owner'] },
      { href: '/admin/audit-logs', label: '稽核紀錄', roles: ['owner', 'manager'] },
      { href: '/admin/settings', label: '設定', roles: ['owner'] },
    ],
  },
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
  if (admin.mustChangePassword) {
    redirect('/admin/change-password')
  }

  const visibleGroups = NAV.map((g) => ({
    label: g.label,
    items: g.items
      .filter((it) => !it.roles || it.roles.includes(admin.role))
      .map((it) => ({ href: it.href, label: it.label })),
  })).filter((g) => g.items.length > 0)

  return (
    <AdminShell
      admin={{ name: admin.name, email: admin.email, role: admin.role }}
      roleLabel={roleLabel(admin.role)}
      navGroups={visibleGroups}
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
