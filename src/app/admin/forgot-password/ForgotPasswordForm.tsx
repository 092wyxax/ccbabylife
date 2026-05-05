'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPending(true)
    setError(null)

    const supabase = createSupabaseBrowserClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    })

    if (err) {
      setError(err.message)
      setPending(false)
      return
    }

    setSent(true)
    setPending(false)
  }

  if (sent) {
    return (
      <div className="bg-success/10 border border-success/40 rounded-md p-4 text-sm space-y-2">
        <p className="font-medium">✓ 重設信已寄出</p>
        <p className="text-ink-soft text-xs leading-relaxed">
          請到 <span className="font-mono">{email}</span> 收信，點擊連結後設定新密碼。
          連結有效時間 1 小時。
        </p>
        <p className="text-ink-soft text-xs leading-relaxed">
          ⚠ 沒收到？檢查垃圾信夾。寄件人可能是
          <span className="font-mono">noreply@mail.app.supabase.io</span>。
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-ink-soft leading-relaxed">
        輸入後台帳號的 Email，我們會寄重設密碼的連結給你。
      </p>

      {error && (
        <div className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm mb-1.5 text-ink-soft">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus
          className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
        />
      </div>

      <button
        type="submit"
        disabled={pending || !email}
        className="w-full bg-ink text-cream py-2.5 rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50"
      >
        {pending ? '寄送中⋯' : '寄送重設連結'}
      </button>
    </form>
  )
}
