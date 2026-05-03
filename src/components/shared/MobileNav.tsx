'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
}

interface Props {
  items: NavItem[]
}

export function MobileNav({ items }: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const drawer =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] sm:hidden"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setOpen(false)}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-72 max-w-[85vw] flex flex-col"
              style={{
                background: '#faf7f2',
                boxShadow: '-8px 0 24px rgba(0,0,0,0.15)',
              }}
            >
              <div className="flex items-center justify-between p-5 border-b border-line">
                <span className="font-serif text-lg tracking-wide">
                  <span className="font-jp text-xs tracking-[0.3em] text-ink-soft mr-2">
                    メニュー
                  </span>
                  選單
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center w-10 h-10 text-ink-soft hover:text-ink"
                  aria-label="關閉"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                    className="pointer-events-none"
                  >
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="6" y1="18" x2="18" y2="6" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 p-5 space-y-3 overflow-y-auto">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block py-2 text-base hover:text-accent transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sm:hidden inline-flex items-center justify-center w-10 h-10 text-ink-soft hover:text-ink"
        aria-label="開啟選單"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className="pointer-events-none"
        >
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>
      {drawer}
    </>
  )
}
