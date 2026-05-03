'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream text-ink px-6 text-center">
      <p className="font-jp text-xs tracking-[0.3em] text-danger mb-4">
        500 · エラーが発生しました
      </p>
      <h1 className="font-serif text-4xl mb-3 tracking-wide">出了點狀況</h1>
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
          className="font-jp bg-ink text-cream px-5 py-3 hover:bg-accent transition-colors tracking-wider"
        >
          再試行 · 重試
        </button>
        <Link
          href="/"
          className="font-jp border border-line px-5 py-3 hover:border-ink transition-colors tracking-wider"
        >
          ホームへ · 回首頁
        </Link>
      </div>
    </div>
  )
}
