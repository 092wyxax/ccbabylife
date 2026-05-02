'use client'

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print bg-ink text-cream px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors"
    >
      列印揀貨單
    </button>
  )
}
