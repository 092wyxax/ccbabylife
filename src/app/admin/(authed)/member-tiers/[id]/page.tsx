import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTierById } from '@/server/services/MemberTierService'
import { TierForm } from '@/components/admin/TierForm'
import { updateTierAction } from '@/server/actions/member-tiers'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditTierPage({ params }: Props) {
  const { id } = await params
  const tier = await getTierById(id)
  if (!tier) notFound()

  const boundUpdate = updateTierAction.bind(null, id)

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/member-tiers" className="hover:text-ink">會員分級</Link>
        <span className="mx-2">/</span>
        <span>{tier.name}</span>
      </nav>
      <h1 className="font-serif text-2xl mb-6">編輯：{tier.name}</h1>
      <TierForm tier={tier} action={boundUpdate} submitLabel="儲存變更" />
    </div>
  )
}
