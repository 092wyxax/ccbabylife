import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCustomerSession } from '@/lib/customer-session'
import { AddressForm } from '@/components/account/AddressForm'

export default async function NewAddressPage() {
  const session = await getCustomerSession()
  if (!session) redirect('/account')

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/account" className="hover:text-ink">會員中心</Link>
        <span className="mx-2">/</span>
        <Link href="/account/addresses" className="hover:text-ink">常用地址</Link>
        <span className="mx-2">/</span>
        <span>新增</span>
      </nav>
      <h1 className="font-serif text-3xl mb-8">新增地址</h1>
      <AddressForm mode="create" />
    </div>
  )
}
