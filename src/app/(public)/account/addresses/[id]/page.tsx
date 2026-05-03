import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCustomerSession } from '@/lib/customer-session'
import { getAddressForCustomer } from '@/server/services/AddressService'
import { AddressForm } from '@/components/account/AddressForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditAddressPage({ params }: Props) {
  const session = await getCustomerSession()
  if (!session) redirect('/account')

  const { id } = await params
  const address = await getAddressForCustomer(session.customerId, id)
  if (!address) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/account" className="hover:text-ink">會員中心</Link>
        <span className="mx-2">/</span>
        <Link href="/account/addresses" className="hover:text-ink">常用地址</Link>
        <span className="mx-2">/</span>
        <span>{address.label}</span>
      </nav>
      <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">
        EDIT · お届け先の編集
      </p>
      <h1 className="font-serif text-3xl mb-8 tracking-wide">編輯地址</h1>
      <AddressForm mode="edit" address={address} />
    </div>
  )
}
