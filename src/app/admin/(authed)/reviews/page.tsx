import Link from 'next/link'
import { listAdminReviews } from '@/server/services/ReviewService'
import { moderateReviewFormAction } from '@/server/actions/reviews'

interface Props {
  searchParams: Promise<{ status?: 'pending' | 'approved' | 'rejected' }>
}

export default async function ReviewsAdminPage({ searchParams }: Props) {
  const params = await searchParams
  const status = params.status
  const reviews = await listAdminReviews(status)

  return (
    <div className="p-8 max-w-5xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl mb-1">客戶評論</h1>
        <p className="text-ink-soft text-sm">
          審核後才會出現在商品頁。
        </p>
      </header>

      <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-line">
        <Chip value={undefined} current={status} label="全部" />
        <Chip value="pending" current={status} label="待審" />
        <Chip value="approved" current={status} label="已通過" />
        <Chip value="rejected" current={status} label="已退回" />
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white border border-line rounded-lg p-12 text-center text-ink-soft">
          沒有符合條件的評論
        </div>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="bg-white border border-line rounded-lg p-5">
              <header className="flex items-baseline justify-between mb-2">
                <div>
                  <p className="text-sm">
                    {'★'.repeat(r.rating)}
                    {'☆'.repeat(5 - r.rating)}
                    {r.title && <span className="ml-3 font-medium">{r.title}</span>}
                  </p>
                  <p className="text-xs text-ink-soft mt-1">
                    {r.productName ?? '(已刪除商品)'} · {new Date(r.createdAt).toLocaleString('zh-TW')}
                    {r.isVerifiedBuyer && (
                      <span className="ml-2 bg-success/15 text-ink px-2 py-0.5 rounded-full">
                        已購買
                      </span>
                    )}
                  </p>
                </div>
                <span
                  className={
                    'text-xs px-2 py-0.5 rounded-full ' +
                    (r.status === 'approved'
                      ? 'bg-success/15 text-ink'
                      : r.status === 'rejected'
                      ? 'bg-danger/15 text-danger'
                      : 'bg-warning/20 text-ink')
                  }
                >
                  {r.status === 'approved'
                    ? '已通過'
                    : r.status === 'rejected'
                    ? '已退回'
                    : '待審'}
                </span>
              </header>

              <p className="text-sm leading-relaxed text-ink/90 whitespace-pre-wrap mb-4">
                {r.body}
              </p>

              <div className="flex items-center gap-2 pt-3 border-t border-line">
                {r.status !== 'approved' && (
                  <ActionButton reviewId={r.id} status="approved" label="通過" variant="success" />
                )}
                {r.status !== 'rejected' && (
                  <ActionButton reviewId={r.id} status="rejected" label="退回" variant="danger" />
                )}
                {r.status !== 'pending' && (
                  <ActionButton reviewId={r.id} status="pending" label="設回待審" variant="neutral" />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Chip({
  current,
  value,
  label,
}: {
  current: string | undefined
  value: string | undefined
  label: string
}) {
  const active = value ? current === value : !current
  const href = value ? `/admin/reviews?status=${value}` : '/admin/reviews'
  return (
    <Link
      href={href}
      className={
        'text-xs px-3 py-1 rounded-full border transition-colors ' +
        (active
          ? 'bg-ink text-cream border-ink'
          : 'border-line text-ink-soft hover:border-ink hover:text-ink')
      }
    >
      {label}
    </Link>
  )
}

function ActionButton({
  reviewId,
  status,
  label,
  variant,
}: {
  reviewId: string
  status: 'approved' | 'rejected' | 'pending'
  label: string
  variant: 'success' | 'danger' | 'neutral'
}) {
  const cls =
    variant === 'success'
      ? 'bg-success/15 hover:bg-success hover:text-white text-ink'
      : variant === 'danger'
      ? 'bg-danger/15 hover:bg-danger hover:text-white text-ink'
      : 'bg-line hover:bg-ink hover:text-cream text-ink'

  return (
    <form action={moderateReviewFormAction}>
      <input type="hidden" name="reviewId" value={reviewId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={'text-xs px-3 py-1 rounded-md transition-colors ' + cls}
      >
        {label}
      </button>
    </form>
  )
}
