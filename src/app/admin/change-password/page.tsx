import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/server/services/AdminAuthService'
import { ChangePasswordForm } from './ChangePasswordForm'

export const dynamic = 'force-dynamic'

export default async function ChangePasswordPage() {
  const me = await getCurrentAdmin()
  if (!me) redirect('/admin/login')

  const forced = me.mustChangePassword

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-line rounded-lg p-8 shadow-sm">
        <p className="text-center text-xs uppercase tracking-widest text-ink-soft mb-2">
          {forced ? '初次登入' : '修改密碼'}
        </p>
        <h1 className="text-center font-serif text-xl mb-2">
          {forced ? '請先設定新密碼' : '修改密碼'}
        </h1>
        <p className="text-center text-xs text-ink-soft mb-6">
          {forced
            ? '為保護你的帳號，初始密碼只能用一次。'
            : `你目前的帳號：${me.email}`}
        </p>

        <ChangePasswordForm />
      </div>
    </div>
  )
}
