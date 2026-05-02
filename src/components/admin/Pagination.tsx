import Link from 'next/link'

interface Props {
  page: number
  totalPages: number
  total: number
  /** Build a link href for a given page (preserves other query params). */
  href: (page: number) => string
}

export function Pagination({ page, totalPages, total, href }: Props) {
  if (totalPages <= 1) {
    return (
      <p className="text-xs text-ink-soft mt-4 text-center">共 {total} 筆</p>
    )
  }

  const prev = Math.max(1, page - 1)
  const next = Math.min(totalPages, page + 1)

  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <p className="text-xs text-ink-soft">
        共 {total} 筆 · 第 {page} / {totalPages} 頁
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={href(prev)}
            className="border border-line rounded-md px-3 py-1.5 hover:border-ink"
          >
            ← 上一頁
          </Link>
        ) : (
          <span className="border border-line rounded-md px-3 py-1.5 text-ink-soft cursor-not-allowed">
            ← 上一頁
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={href(next)}
            className="border border-line rounded-md px-3 py-1.5 hover:border-ink"
          >
            下一頁 →
          </Link>
        ) : (
          <span className="border border-line rounded-md px-3 py-1.5 text-ink-soft cursor-not-allowed">
            下一頁 →
          </span>
        )}
      </div>
    </div>
  )
}

export function SearchBox({
  defaultValue,
  placeholder,
  hiddenFields,
}: {
  defaultValue?: string
  placeholder?: string
  hiddenFields?: Record<string, string | undefined>
}) {
  return (
    <form method="GET" className="flex items-center gap-2 mb-4">
      {hiddenFields &&
        Object.entries(hiddenFields).map(([k, v]) =>
          v ? <input key={k} type="hidden" name={k} value={v} /> : null
        )}
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder ?? '搜尋⋯'}
        className="flex-1 max-w-sm border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-ink"
      />
      <button
        type="submit"
        className="bg-ink text-cream px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors"
      >
        搜尋
      </button>
    </form>
  )
}
