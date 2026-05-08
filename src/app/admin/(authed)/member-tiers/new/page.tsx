import Link from 'next/link'
import { TierForm } from '@/components/admin/TierForm'
import { createTierAction } from '@/server/actions/member-tiers'

export default function NewTierPage() {
  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/member-tiers" className="hover:text-ink">會員分級</Link>
        <span className="mx-2">/</span>
        <span>新增等級</span>
      </nav>
      <h1 className="font-serif text-2xl mb-6">新增會員等級</h1>
      <TierForm action={createTierAction} submitLabel="建立" />
    </div>
  )
}
