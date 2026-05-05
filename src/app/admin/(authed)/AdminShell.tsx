'use client'

import { useState } from 'react'
import Link from 'next/link'
import { logoutAction } from '@/server/actions/auth'
import type { AdminRole } from '@/db/schema'

type NavItem = { href: string; label: string }
type NavGroup = { label: string; items: NavItem[] }

type Props = {
  admin: { name: string | null; email: string; role: AdminRole }
  roleLabel: string
  navGroups: NavGroup[]
  children: React.ReactNode
}

export function AdminShell({ admin, roleLabel, navGroups, children }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-cream-50 lg:flex">
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-white border-b border-line px-4 py-3">
        <Link href="/admin" className="font-serif text-base">
          日系選物店 · 後台
        </Link>
        <button
          type="button"
          aria-label="開啟選單"
          onClick={() => setOpen(true)}
          className="p-2 -mr-2 text-ink"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {open && (
        <button
          type="button"
          aria-label="關閉選單"
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
        />
      )}

      <aside
        className={`${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:sticky inset-y-0 left-0 top-0 z-50 w-64 lg:w-56 h-screen lg:h-screen bg-white border-r border-line flex flex-col transition-transform duration-200`}
      >
        <div className="p-6 border-b border-line flex items-center justify-between">
          <div>
            <Link href="/admin" className="font-serif text-lg" onClick={() => setOpen(false)}>
              日系選物店
            </Link>
            <p className="text-xs text-ink-soft mt-1">後台</p>
          </div>
          <button
            type="button"
            aria-label="關閉"
            onClick={() => setOpen(false)}
            className="lg:hidden p-1 -mr-1 text-ink-soft"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-3 text-sm overflow-y-auto">
          {navGroups.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? 'mt-4' : ''}>
              <p className="px-3 mb-1 text-[10px] uppercase tracking-[0.2em] text-ink-soft/70">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-1.5 rounded-md hover:bg-cream-100 text-ink-soft hover:text-ink"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-line text-xs space-y-2">
          <div>
            <p className="text-ink-soft mb-1">登入身份</p>
            <p className="font-medium">{admin.name}</p>
            <p className="text-ink-soft">
              {admin.email} · {roleLabel}
            </p>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Link
              href="/admin/change-password"
              onClick={() => setOpen(false)}
              className="text-ink-soft hover:text-ink underline"
            >
              修改密碼
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-ink-soft hover:text-danger underline"
              >
                登出
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
