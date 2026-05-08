import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { sources } from '@/db/schema/sources'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { SourceForm } from '@/components/admin/SourceForm'
import { updateSourceAction } from '@/server/actions/sources'
import { requireRole } from '@/server/services/AdminAuthService'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditSourcePage({ params }: Props) {
  try {
    return await renderPage(await params)
  } catch (err) {
    return (
      <div className="p-8 max-w-3xl">
        <h1 className="font-serif text-2xl mb-4">編輯（診斷模式）</h1>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <pre className="text-xs text-red-800 whitespace-pre-wrap break-all leading-relaxed">
{err instanceof Error ? `${err.name}: ${err.message}\n\n${err.stack ?? '(no stack)'}` : String(err)}
          </pre>
        </div>
      </div>
    )
  }
}

async function renderPage({ id }: { id: string }) {
  await requireRole(['owner', 'manager', 'buyer'])

  const [source] = await db
    .select()
    .from(sources)
    .where(and(eq(sources.orgId, DEFAULT_ORG_ID), eq(sources.id, id)))
    .limit(1)

  if (!source) notFound()

  const boundUpdate = updateSourceAction.bind(null, source.id)

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/sources" className="hover:text-ink">採購商</Link>
        <span className="mx-2">/</span>
        <Link href={`/admin/sources/${source.id}`} className="hover:text-ink">
          {source.name}
        </Link>
        <span className="mx-2">/</span>
        <span>編輯</span>
      </nav>

      <h1 className="font-serif text-2xl mb-6">編輯：{source.name}</h1>

      <SourceForm
        source={source}
        action={boundUpdate}
        submitLabel="儲存變更"
      />
    </div>
  )
}
