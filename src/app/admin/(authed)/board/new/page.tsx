import Link from 'next/link'
import { requireRole } from '@/server/services/AdminAuthService'
import { createAnnouncementAction } from '@/server/actions/announcements'
import { AnnouncementForm } from '@/components/admin/AnnouncementForm'

export const dynamic = 'force-dynamic'

export default async function NewAnnouncementPage() {
  const me = await requireRole(['owner', 'manager', 'editor'])
  const canPin = me.role === 'owner' || me.role === 'manager'

  return (
    <div className="p-6 sm:p-8">
      <header className="mb-6">
        <Link href="/admin/board" className="text-xs text-ink-soft hover:text-accent">
          ← 公告留言板
        </Link>
        <h1 className="font-serif text-2xl mt-1">發新公告</h1>
      </header>

      <AnnouncementForm
        action={createAnnouncementAction}
        submitLabel="發布"
        canPin={canPin}
      />
    </div>
  )
}
