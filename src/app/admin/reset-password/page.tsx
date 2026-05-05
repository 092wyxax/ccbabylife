import Link from 'next/link'
import { ResetPasswordForm } from './ResetPasswordForm'

export const metadata = {
  title: '重設密碼',
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-line rounded-lg p-8 shadow-sm">
        <Link href="/" className="block text-center font-serif text-xl mb-2">
          熙熙初日
        </Link>
        <p className="text-center text-xs uppercase tracking-widest text-ink-soft mb-6">
          設定新密碼
        </p>

        <ResetPasswordForm />
      </div>
    </div>
  )
}
