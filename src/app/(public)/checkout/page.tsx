import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { customers } from '@/db/schema'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import { getCustomerSession } from '@/lib/customer-session'
import { listAddressesForCustomer } from '@/server/services/AddressService'

export const metadata = {
  title: '結帳',
}

export default async function CheckoutPage() {
  const session = await getCustomerSession()

  let prefill: {
    name: string
    email: string
    phone: string
    lineUserId: string
  } = { name: '', email: '', phone: '', lineUserId: '' }
  let savedAddresses: Awaited<ReturnType<typeof listAddressesForCustomer>> = []

  if (session) {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, session.customerId))
      .limit(1)

    if (customer) {
      prefill = {
        name: customer.name ?? '',
        email: customer.email,
        phone: customer.phone ?? '',
        lineUserId: customer.lineUserId ?? '',
      }
      savedAddresses = await listAddressesForCustomer(session.customerId)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">CHECKOUT · ご注文手続き</p>
      <h1 className="font-serif text-3xl mb-8 tracking-wide">結帳</h1>

      <CheckoutForm prefill={prefill} savedAddresses={savedAddresses} />
    </div>
  )
}
