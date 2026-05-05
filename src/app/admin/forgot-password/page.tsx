import Link from 'next/link'
import { ForgotPasswordForm } from './ForgotPasswordForm'

export const metadata = {
  title: '忘記密碼',
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-line rounded-lg p-8 shadow-sm">
        <Link href="/" className="block text-center font-serif text-xl mb-2">
          熙熙初日
        </Link>
        <p className="text-center text-xs uppercase tracking-widest text-ink-soft mb-6">
          忘記密碼
        </p>

        <ForgotPasswordForm />

        <div className="mt-6 text-center">
          <Link
            href="/admin/login"
            className="text-xs text-ink-soft hover:text-ink underline"
          >
            ← 回登入頁
          </Link>
        </div>
      </div>
    </div>
  )
}
