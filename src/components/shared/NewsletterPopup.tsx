'use client'

import { useEffect, useState } from 'react'
import { NewsletterForm } from './NewsletterForm'
import { NewsletterGiftIllustration } from './BrandIllustrations'

const COOKIE = 'newsletter_popup_dismissed'

export function NewsletterPopup() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const dismissed = document.cookie
      .split('; ')
      .some((c) => c.startsWith(`${COOKIE}=`))
    if (dismissed) return

    const t = setTimeout(() => setOpen(true), 8000)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    setOpen(false)
    // 30-day dismissal cookie
    document.cookie = `${COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="加入電子報，獲得新會員 NT$100 折扣"
      onClick={dismiss}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-cream rounded-xl max-w-md w-full p-6 sm:p-8 shadow-2xl"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="關閉"
          className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-line text-ink-soft hover:text-ink text-xl leading-none flex items-center justify-center"
        >
          ×
        </button>

        <div className="text-seal flex justify-center mb-2">
          <NewsletterGiftIllustration className="w-44 h-32" />
        </div>
        <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2 text-center">
          WELCOME · ようこそ
        </p>
        <h2 className="font-serif text-2xl text-center mb-3 leading-snug">
          首次加入，送你 <span className="text-accent">NT$100</span> 折扣
        </h2>
        <p className="text-sm text-ink-soft text-center mb-5 leading-relaxed">
          訂閱電子報，馬上收到專屬折扣碼。
          <br />
          每月 1-2 封新品 / 截單預告，不轟炸。
        </p>

        <NewsletterForm source="popup" />

        <p className="text-xs text-ink-soft text-center mt-4">
          不再顯示？{' '}
          <button
            type="button"
            onClick={dismiss}
            className="underline hover:text-ink"
          >
            關閉提醒
          </button>
        </p>
      </div>
    </div>
  )
}
