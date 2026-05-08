import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { orders, customers } from '@/db/schema'
import { getReturnRequest } from '@/server/services/ReturnService'
import { adminUpdateReturnAction } from '@/server/actions/returns'
import { requireRole } from '@/server/services/AdminAuthService'
import { formatTwd } from '@/lib/format'
import { returnStatusEnum } from '@/db/schema/return_requests'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<(typeof returnStatusEnum)[number], string> = {
  pending: '審核中',
  approved: '已同意',
  rejected: '已拒絕',
  received: '已收貨',
  refunded: '已退款 / 完成',
  cancelled: '已取消',
}

const TYPE_LABEL = { return: '退貨退款', exchange: '換貨' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminReturnDetailPage({ params }: Props) {
  await requireRole(['owner', 'manager', 'ops'])
  const { id } = await params

  const request = await getReturnRequest(id)
  if (!request) notFound()

  const [order] = await db.select().from(orders).where(eq(orders.id, request.orderId)).limit(1)
  const [customer] = await db.select().from(customers).where(eq(customers.id, request.customerId)).limit(1)

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/returns" className="hover:text-ink">退換貨</Link>
        <span className="mx-2">/</span>
        <span className="font-mono">{request.requestNumber}</span>
      </nav>

      <header className="mb-6">
        <h1 className="font-serif text-2xl mb-1 font-mono">{request.requestNumber}</h1>
        <p className="text-ink-soft text-sm">
          {TYPE_LABEL[request.type as keyof typeof TYPE_LABEL]} ·{' '}
          目前狀態：<strong>{STATUS_LABEL[request.status]}</strong>
        </p>
      </header>

      <section className="bg-white border border-line rounded-lg p-5 space-y-3 mb-6 text-sm">
        <Row label="提交時間" value={new Date(request.createdAt).toLocaleString('zh-TW')} />
        <Row label="客戶" value={`${customer?.name ?? '—'}${customer?.email ? ` (${customer.email})` : ''}`} />
        <Row label="LINE" value={customer?.lineUserId ?? '—'} />
        <Row
          label="原訂單"
          value={
            order ? (
              <Link href={`/admin/orders/${order.id}`} className="font-mono hover:text-accent">
                {order.orderNumber} · {formatTwd(order.total)}
              </Link>
            ) : '—'
          }
        />
        <div>
          <p className="text-ink-soft text-xs uppercase tracking-wider mb-1">客戶填寫的原因</p>
          <p className="whitespace-pre-wrap leading-relaxed bg-cream-100 rounded-md p-3">
            {request.reason}
          </p>
        </div>
        {request.itemsSnapshot && request.itemsSnapshot.length > 0 && (
          <div>
            <p className="text-ink-soft text-xs uppercase tracking-wider mb-1">退換商品</p>
            <ul className="text-xs space-y-1">
              {request.itemsSnapshot.map((it, i) => (
                <li key={i} className="flex justify-between">
                  <span>{it.productNameSnapshot} × {it.quantity}</span>
                  <span className="text-ink-soft">{formatTwd(it.lineTotal)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {request.refundTwd != null && (
          <Row label="預計退款金額" value={formatTwd(request.refundTwd)} bold />
        )}
      </section>

      <section className="bg-white border border-line rounded-lg p-5">
        <h2 className="font-serif text-lg mb-4">處理</h2>
        <form action={adminUpdateReturnAction} className="space-y-4">
          <input type="hidden" name="id" value={request.id} />

          <div>
            <label htmlFor="status" className="block text-sm mb-1.5">
              更新狀態
            </label>
            <select
              id="status"
              name="status"
              defaultValue={request.status}
              className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
            >
              {returnStatusEnum.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="refundTwd" className="block text-sm mb-1.5">
              實際退款金額（選填）
            </label>
            <input
              id="refundTwd"
              name="refundTwd"
              type="number"
              defaultValue={request.refundTwd ?? ''}
              className="w-full sm:w-48 border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
            />
          </div>

          <div>
            <label htmlFor="internalNotes" className="block text-sm mb-1.5">
              內部備註（不顯示給客戶）
            </label>
            <textarea
              id="internalNotes"
              name="internalNotes"
              rows={3}
              defaultValue={request.internalNotes ?? ''}
              className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
            />
          </div>

          <button
            type="submit"
            className="font-jp bg-ink text-cream px-5 py-2.5 rounded-md hover:bg-accent transition-colors tracking-wider"
          >
            儲存變更
          </button>
        </form>

        {request.handledAt && (
          <p className="text-xs text-ink-soft mt-4 pt-4 border-t border-line">
            上次處理：{new Date(request.handledAt).toLocaleString('zh-TW')}
          </p>
        )}
      </section>

      <p className="text-xs text-ink-soft mt-6">
        💡 實際退款金額調整後，需在綠界後台或銀行帳戶手動執行退款動作。本系統僅紀錄狀態。
      </p>
    </div>
  )
}

function Row({
  label,
  value,
  bold,
}: {
  label: string
  value: React.ReactNode
  bold?: boolean
}) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-soft">{label}</span>
      <span className={bold ? 'font-medium' : ''}>{value}</span>
    </div>
  )
}
