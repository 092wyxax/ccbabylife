'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

export function ResetPasswordForm() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    // Supabase recovery link puts the session into PASSWORD_RECOVERY state
    // and stores the token via the # fragment. Wait for the SDK to settle
    // before showing the form.
    const supabase = createSupabaseBrowserClient()
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true)
      }
    })

    // Fallback: if session already valid, show form too.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })

    // If no recovery happens within 3 seconds, surface an error.
    const t = setTimeout(() => {
      if (!ready) {
        setAuthError('重設連結無效或已過期，請回忘記密碼頁重新申請。')
      }
    }, 3000)

    return () => {
      sub.subscription.unsubscribe()
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('兩次密碼不一致')
      return
    }
    if (password.length < 8) {
      setError('密碼至少 8 字元')
      return
    }

    setPending(true)
    const supabase = createSupabaseBrowserClient()
    const { error: err } = await supabase.auth.updateUser({ password })

    if (err) {
      setError(err.message)
      setPending(false)
      return
    }

    router.push('/admin')
  }

  if (authError) {
    return (
      <div className="space-y-4">
        <div className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
          {authError}
        </div>
        <a
          href="/admin/forgot-password"
          className="block text-center w-full bg-ink text-cream py-2.5 rounded-md text-sm hover:bg-accent transition-colors"
        >
          重新申請重設連結
        </a>
      </div>
    )
  }

  if (!ready) {
    return (
      <p className="text-sm text-ink-soft text-center py-6">
        正在驗證重設連結⋯
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm mb-1.5 text-ink-soft">
          新密碼
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
        />
        <p className="text-xs text-ink-soft mt-1">至少 8 字元</p>
      </div>

      <div>
        <label htmlFor="confirm" className="block text-sm mb-1.5 text-ink-soft">
          再次輸入新密碼
        </label>
        <input
          id="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ink text-cream py-2.5 rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50"
      >
        {pending ? '儲存中⋯' : '設定新密碼並登入'}
      </button>
    </form>
  )
}
