import Link from 'next/link'
import { listSuppliers } from '@/server/services/PurchaseService'
import { SUPPLIER_TYPE_LABEL } from '@/lib/purchase-status'
import { SupplierAddForm } from '@/components/admin/SupplierAddForm'

export default async function SuppliersPage() {
  const suppliers = await listSuppliers()

  return (
    <div className="p-8 max-w-5xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/purchases" className="hover:text-ink">採購管理</Link>
        <span className="mx-2">/</span>
        <span>供應商</span>
      </nav>

      <h1 className="font-serif text-2xl mb-1">供應商管理</h1>
      <p className="text-ink-soft text-sm mb-8">
        每張採購單可指定一個供應商，用於統計與對帳。
      </p>

      <section className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
            目前 {suppliers.length} 個供應商
          </h2>
          <div className="bg-white border border-line rounded-lg overflow-hidden">
            {suppliers.length === 0 ? (
              <p className="p-8 text-center text-ink-soft text-sm">
                還沒有供應商，請從右側新增。
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-cream-100 text-ink-soft">
                  <tr>
                    <th className="text-left px-4 py-3 font-normal">名稱</th>
                    <th className="text-left px-4 py-3 font-normal">類型</th>
                    <th className="text-left px-4 py-3 font-normal">聯絡資訊</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id} className="border-t border-line">
                      <td className="px-4 py-3">{s.name}</td>
                      <td className="px-4 py-3 text-ink-soft">
                        {SUPPLIER_TYPE_LABEL[s.type]}
                      </td>
                      <td className="px-4 py-3 text-ink-soft text-xs">
                        {s.contactInfo ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <aside>
          <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
            新增供應商
          </h2>
          <SupplierAddForm />
        </aside>
      </section>
    </div>
  )
}
