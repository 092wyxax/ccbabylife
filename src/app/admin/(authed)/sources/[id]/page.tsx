import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { sources } from '@/db/schema/sources'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { SourceForm } from '@/components/admin/SourceForm'
import { updateSourceAction, deleteSourceAction } from '@/server/actions/sources'
import { requireRole } from '@/server/services/AdminAuthService'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditSourcePage({ params }: Props) {
  await requireRole(['owner', 'manager', 'buyer'])
  const { id } = await params

  const [source] = await db
    .select()
    .from(sources)
    .where(and(eq(sources.orgId, DEFAULT_ORG_ID), eq(sources.id, id)))
    .limit(1)

  if (!source) notFound()

  const boundUpdate = updateSourceAction.bind(null, source.id)
  const boundDelete = deleteSourceAction.bind(null, source.id)

  return (
    <div className="p-6 sm:p-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/sources"
            className="text-xs text-ink-soft hover:text-accent"
          >
            ← 採購商
          </Link>
          <h1 className="font-serif text-2xl mt-1">編輯：{source.name}</h1>
        </div>

        <form action={boundDelete}>
          <button
            type="submit"
            className="text-sm text-danger hover:underline"
            onClick={(e) => {
              if (!confirm(`確定要刪除「${source.name}」嗎？`)) {
                e.preventDefault()
              }
            }}
          >
            刪除
          </button>
        </form>
      </header>

      <SourceForm
        source={source}
        action={boundUpdate}
        submitLabel="儲存變更"
      />
    </div>
  )
}
