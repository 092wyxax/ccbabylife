import Link from 'next/link'
import { SourceForm } from '@/components/admin/SourceForm'
import { createSourceAction } from '@/server/actions/sources'
import { requireRole } from '@/server/services/AdminAuthService'

export const dynamic = 'force-dynamic'

export default async function NewSourcePage() {
  await requireRole(['owner', 'manager', 'buyer'])

  return (
    <div className="p-6 sm:p-8">
      <header className="mb-6">
        <Link
          href="/admin/sources"
          className="text-xs text-ink-soft hover:text-accent"
        >
          ← 採購商
        </Link>
        <h1 className="font-serif text-2xl mt-1">新增採購商</h1>
      </header>

      <SourceForm action={createSourceAction} submitLabel="儲存" />
    </div>
  )
}
