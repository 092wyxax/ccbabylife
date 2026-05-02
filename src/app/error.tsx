'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // TODO: forward to Sentry once SENTRY_DSN is configured
    console.error('Unhandled error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream text-ink px-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-danger mb-4">
        500 · Server Error
      </p>
      <h1 className="font-serif text-4xl mb-3">出了點狀況</h1>
      <p className="text-ink-soft text-sm max-w-md leading-relaxed mb-2">
        頁面載入時發生未預期錯誤，我們已收到紀錄。可以先重試或回首頁；急事請私訊我們的 LINE。
      </p>
      {error.digest && (
        <p className="text-xs text-ink-soft mb-8 font-mono">
          參考編號：{error.digest}
        </p>
      )}

      <div className="flex flex-wrap gap-3 justify-center text-sm">
        <button
          type="button"
          onClick={reset}
          className="bg-ink text-cream px-5 py-3 rounded-full hover:bg-accent transition-colors"
        >
          重試
        </button>
        <Link
          href="/"
          className="border border-line px-5 py-3 rounded-full hover:border-ink transition-colors"
        >
          回首頁
        </Link>
      </div>
    </div>
  )
}
