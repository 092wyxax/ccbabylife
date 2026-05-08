import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { sources, type Source } from '@/db/schema/sources'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { deleteSourceAction } from '@/server/actions/sources'
import { requireRole } from '@/server/services/AdminAuthService'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

const TYPE_LABEL: Record<Source['type'], string> = {
  platform: '平台',
  brand: '品牌官網',
  chain: '連鎖店',
  resale: '二手平台',
  other: '其他',
}

const STATUS_LABEL: Record<Source['status'], { label: string; color: string }> = {
  active: { label: '常用', color: 'bg-success/20 text-success' },
  paused: { label: '暫停', color: 'bg-ink-soft/20 text-ink-soft' },
  dropped: { label: '不再使用', color: 'bg-danger/15 text-danger' },
}

export default async function SourceDetailPage({ params }: Props) {
  try {
    return await renderPage(await params)
  } catch (err) {
    return (
      <div className="p-8 max-w-3xl">
        <h1 className="font-serif text-2xl mb-4">採購商檢視（診斷模式）</h1>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <pre className="text-xs text-red-800 whitespace-pre-wrap break-all leading-relaxed">
{err instanceof Error ? `${err.name}: ${err.message}\n\n${err.stack ?? '(no stack)'}` : String(err)}
          </pre>
        </div>
      </div>
    )
  }
}

async function renderPage({ id }: { id: string }) {
  await requireRole(['owner', 'manager', 'buyer'])

  const [source] = await db
    .select()
    .from(sources)
    .where(and(eq(sources.orgId, DEFAULT_ORG_ID), eq(sources.id, id)))
    .limit(1)

  if (!source) notFound()

  const status = STATUS_LABEL[source.status]
  const boundDelete = deleteSourceAction.bind(null, source.id)

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/sources" className="hover:text-ink">採購商</Link>
        <span className="mx-2">/</span>
        <span>{source.name}</span>
      </nav>

      <header className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-2xl mb-1 break-words">{source.name}</h1>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-ink-soft">{TYPE_LABEL[source.type]}</span>
            <span className={`px-2 py-0.5 rounded ${status.color}`}>
              {status.label}
            </span>
            {source.code && (
              <span className="font-mono text-ink-soft bg-cream-100 px-2 py-0.5 rounded">
                SKU: {source.code}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href={`/admin/sources/${source.id}/edit`}
            className="font-jp text-sm bg-ink text-cream px-4 py-2 rounded-md hover:bg-accent transition-colors tracking-wider"
          >
            編集 · 編輯
          </Link>
          <form action={boundDelete}>
            <button
              type="submit"
              className="text-sm text-danger hover:underline"
            >
              刪除
            </button>
          </form>
        </div>
      </header>

      <div className="bg-white border border-line rounded-lg p-6 space-y-4">
        <Field label="網址">
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline break-all"
          >
            {source.url} ↗
          </a>
        </Field>

        <Field label="評分">
          {source.rating != null ? (
            <span className="text-amber-500">
              {'★'.repeat(source.rating)}
              <span className="text-line">{'☆'.repeat(5 - source.rating)}</span>
              <span className="text-ink-soft ml-2 text-xs">{source.rating} / 5</span>
            </span>
          ) : (
            <span className="text-ink-soft">—</span>
          )}
        </Field>

        <Field label="強項 / 特色">
          <p className="whitespace-pre-wrap leading-relaxed">
            {source.strengths || <span className="text-ink-soft">—</span>}
          </p>
        </Field>

        <Field label="商品類別">
          {source.categories && source.categories.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {source.categories.map((c) => (
                <span
                  key={c}
                  className="text-xs bg-cream-100 border border-line px-2 py-0.5 rounded"
                >
                  {c}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-ink-soft">—</span>
          )}
        </Field>

        <Field label="付款方式">
          {source.paymentMethods && source.paymentMethods.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {source.paymentMethods.map((p) => (
                <span
                  key={p}
                  className="text-xs bg-cream-100 border border-line px-2 py-0.5 rounded"
                >
                  {p}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-ink-soft">—</span>
          )}
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="需要會員">
            {source.needsMembership ? '是' : '否'}
          </Field>
          <Field label="海外運送">
            {source.shipsOverseas ? '是' : '否'}
          </Field>
          <Field label="平均處理天數">
            {source.avgProcessingDays != null ? `${source.avgProcessingDays} 天` : '—'}
          </Field>
          <Field label="平均訂單金額">
            {source.avgOrderJpy != null ? `¥${source.avgOrderJpy.toLocaleString()}` : '—'}
          </Field>
        </div>

        <Field label="最後叫貨">
          {source.lastOrderedAt
            ? new Date(source.lastOrderedAt).toLocaleString('zh-TW')
            : '—'}
        </Field>

        <Field label="備註">
          <p className="whitespace-pre-wrap leading-relaxed text-sm">
            {source.notes || <span className="text-ink-soft">—</span>}
          </p>
        </Field>
      </div>

      <p className="text-xs text-ink-soft mt-4">
        建立 {new Date(source.createdAt).toLocaleDateString('zh-TW')} · 更新{' '}
        {new Date(source.updatedAt).toLocaleDateString('zh-TW')}
      </p>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 text-sm">
      <span className="text-ink-soft text-xs uppercase tracking-wider pt-0.5">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
