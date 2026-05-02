import Link from 'next/link'
import { listSuppliers } from '@/server/services/PurchaseService'
import { PurchaseCreateForm } from '@/components/admin/PurchaseCreateForm'

export default async function NewPurchasePage() {
  const suppliers = await listSuppliers()
  return (
    <div className="p-8 max-w-3xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/purchases" className="hover:text-ink">採購管理</Link>
        <span className="mx-2">/</span>
        <span>新建</span>
      </nav>
      <h1 className="font-serif text-2xl mb-1">建立採購單</h1>
      <p className="text-ink-soft text-sm mb-8">
        建立後可在詳情頁逐一加入採購項目。預估日幣總額會在加入項目時自動更新。
      </p>
      <PurchaseCreateForm suppliers={suppliers} />
    </div>
  )
}
