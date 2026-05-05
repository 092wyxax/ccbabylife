'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { loginAction, type LoginState } from '@/server/actions/auth'

const initialState: LoginState = {}

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState)

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="w-full max-w-sm bg-white border border-line rounded-lg p-8 shadow-sm">
        <Link href="/" className="block text-center font-serif text-xl mb-2">
          日系選物店
        </Link>
        <p className="text-center text-xs uppercase tracking-widest text-ink-soft mb-8">
          後台登入
        </p>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm mb-1.5 text-ink-soft">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm mb-1.5 text-ink-soft">
              密碼
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
            />
          </div>

          {state.error && (
            <p className="text-sm text-danger">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-ink text-cream py-2.5 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
          >
            {pending ? '登入中⋯' : '登入'}
          </button>

          <div className="text-center">
            <Link
              href="/admin/forgot-password"
              className="text-xs text-ink-soft hover:text-ink underline"
            >
              忘記密碼？
            </Link>
          </div>
        </form>

        <p className="mt-8 text-xs text-ink-soft text-center">
          僅限店主、經理、客服、採購、編輯使用
        </p>
      </div>
    </div>
  )
}
