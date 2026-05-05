import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { announcements } from '@/db/schema/announcements'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { requireRole } from '@/server/services/AdminAuthService'
import { updateAnnouncementAction } from '@/server/actions/announcements'
import { AnnouncementForm } from '@/components/admin/AnnouncementForm'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditAnnouncementPage({ params }: Props) {
  const me = await requireRole(['owner', 'manager', 'editor'])
  const { id } = await params

  const [a] = await db
    .select()
    .from(announcements)
    .where(and(eq(announcements.orgId, DEFAULT_ORG_ID), eq(announcements.id, id)))
    .limit(1)

  if (!a) notFound()

  // Author OR owner/manager can edit
  const canEdit = a.authorId === me.id || me.role === 'owner' || me.role === 'manager'
  if (!canEdit) notFound()

  const canPin = me.role === 'owner' || me.role === 'manager'
  const boundUpdate = updateAnnouncementAction.bind(null, id)

  return (
    <div className="p-6 sm:p-8">
      <header className="mb-6">
        <Link href={`/admin/board/${id}`} className="text-xs text-ink-soft hover:text-accent">
          ← 返回公告
        </Link>
        <h1 className="font-serif text-2xl mt-1">編輯公告</h1>
      </header>

      <AnnouncementForm
        announcement={a}
        action={boundUpdate}
        submitLabel="儲存變更"
        canPin={canPin}
      />
    </div>
  )
}
