'use client'

import { usePathname } from 'next/navigation'
import { LINE_OA_URL } from '@/lib/line-oa'

export function LineFloatingButton() {
  const pathname = usePathname()
  // Hide on admin pages and on the OA page itself
  if (pathname.startsWith('/admin')) return null

  return (
    <a
      href={LINE_OA_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="LINE 客服"
      className="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 z-40 group"
    >
      {/* Persistent label badge above the bubble — tells visitors it's worth tapping */}
      <span className="absolute -top-8 right-0 whitespace-nowrap text-[10px] bg-ink text-cream px-2 py-1 rounded-md tracking-wider shadow-md before:content-[''] before:absolute before:top-full before:right-3 before:border-4 before:border-transparent before:border-t-ink">
        🎁 首單 NT$100
      </span>
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs bg-ink text-cream px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        加 LINE 享優惠
      </span>
      <span className="flex items-center justify-center w-14 h-14 rounded-full bg-[#06C755] text-white shadow-lg hover:scale-105 active:scale-95 transition-transform">
        <svg
          width="28"
          height="28"
          viewBox="0 0 36 36"
          fill="currentColor"
          aria-hidden
        >
          <path d="M18 4C9.7 4 3 9.5 3 16.3c0 6.1 5.4 11.2 12.7 12.2.5.1 1.2.3 1.4.7.1.4 0 1-.1 1.4 0 0-.2 1-.2 1.2-.1.4-.3 1.4 1.2.8 1.5-.7 8.4-4.9 11.4-8.5 2-2.4 3-4.9 3-7.8C32.6 9.5 25.9 4 18 4z" />
          <path
            fill="#06C755"
            d="M14 13.5h-1.7c-.2 0-.3.1-.3.3v6.1c0 .2.1.3.3.3H14c.2 0 .3-.1.3-.3v-6.1c0-.2-.1-.3-.3-.3zM21.7 13.5H20c-.2 0-.3.1-.3.3v3.6L17 13.7c0-.1-.1-.1-.1-.1h-1.7c-.2 0-.3.1-.3.3v6.1c0 .2.1.3.3.3h1.7c.2 0 .3-.1.3-.3v-3.6l2.7 3.7c0 .1.1.1.2.1H21.7c.2 0 .3-.1.3-.3v-6.1c0-.2-.1-.3-.3-.3zM10.7 18.5H8.3v-4.7c0-.2-.1-.3-.3-.3H6.3c-.2 0-.3.1-.3.3v6.1c0 .1 0 .2.1.2 0 0 .1.1.2.1H10.7c.2 0 .3-.1.3-.3v-1.2c0-.1-.1-.2-.3-.2zM27.3 15v-1.2c0-.2-.1-.3-.3-.3h-3.9c-.2 0-.3.1-.3.3v6.1c0 .2.1.3.3.3H27c.2 0 .3-.1.3-.3v-1.2c0-.2-.1-.3-.3-.3h-2.5v-1h2.5c.2 0 .3-.1.3-.3v-1.2c0-.2-.1-.3-.3-.3h-2.5v-1H27c.2 0 .3-.1.3-.3z"
          />
        </svg>
      </span>
    </a>
  )
}
