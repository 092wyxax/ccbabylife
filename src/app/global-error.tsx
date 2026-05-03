'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
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
    <html lang="zh-Hant">
      <body
        style={{
          background: '#faf7f2',
          color: '#2d2a26',
          fontFamily: 'system-ui, sans-serif',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <div>
          <p style={{ fontSize: '0.75rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#b85a4a' }}>
            Critical · Application Error
          </p>
          <h1 style={{ fontSize: '2rem', margin: '1rem 0' }}>網站暫時無法載入</h1>
          <p style={{ color: '#7a756f', maxWidth: '28rem', margin: '0 auto 2rem' }}>
            應用層級錯誤，已通知技術團隊。請稍後再試或私訊 LINE 客服。
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: '#2d2a26',
              color: '#faf7f2',
              padding: '0.75rem 1.25rem',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            重試
          </button>
        </div>
      </body>
    </html>
  )
}
