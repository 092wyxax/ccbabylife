import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCustomerSession } from '@/lib/customer-session'
import { listAddressesForCustomer } from '@/server/services/AddressService'
import { deleteAddressFormAction } from '@/server/actions/addresses'

export default async function AddressesPage() {
  const session = await getCustomerSession()
  if (!session) redirect('/account')

  const addresses = await listAddressesForCustomer(session.customerId)

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/account" className="hover:text-ink">會員中心</Link>
        <span className="mx-2">/</span>
        <span>常用地址</span>
      </nav>

      <header className="flex items-start justify-between mb-8">
        <div>
          <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">
            ADDRESS · お届け先
          </p>
          <h1 className="font-serif text-3xl tracking-wide">常用地址</h1>
          <p className="text-ink-soft text-sm mt-1">
            結帳時可以直接挑選，不用每次重打。第一個會自動成為預設。
          </p>
        </div>
        <Link
          href="/account/addresses/new"
          className="font-jp bg-ink text-cream px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors tracking-wider"
        >
          + 新規追加 · 新增
        </Link>
      </header>

      {addresses.length === 0 ? (
        <div className="py-16 text-center text-ink-soft border border-dashed border-line rounded-lg">
          還沒有儲存地址。點右上「+ 新增地址」開始。
        </div>
      ) : (
        <ul className="space-y-3">
          {addresses.map((a) => (
            <li
              key={a.id}
              className="bg-white border border-line rounded-lg p-5"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    {a.label}
                    {a.isDefault && (
                      <span className="font-jp text-xs bg-accent/20 text-ink px-2 py-0.5 rounded-full tracking-wider">
                        既定 · 預設
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-ink-soft mt-1">
                    {a.recipientName} · {a.phone}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <Link
                    href={`/account/addresses/${a.id}`}
                    className="text-ink-soft hover:text-accent underline"
                  >
                    編輯
                  </Link>
                  <form action={deleteAddressFormAction}>
                    <input type="hidden" name="addressId" value={a.id} />
                    <button
                      type="submit"
                      className="text-ink-soft hover:text-danger underline"
                    >
                      刪除
                    </button>
                  </form>
                </div>
              </div>
              <p className="text-sm text-ink/90 mt-2">
                {a.zipcode} {a.city} {a.street}
              </p>
              {a.notes && (
                <p className="text-xs text-ink-soft mt-1 italic">
                  {a.notes}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
