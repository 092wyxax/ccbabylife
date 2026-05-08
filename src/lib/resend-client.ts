import 'server-only'
import { Resend } from 'resend'

let _client: Resend | null = null

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

export function getResend(): Resend | null {
  if (!isResendConfigured()) return null
  if (!_client) {
    _client = new Resend(process.env.RESEND_API_KEY!)
  }
  return _client
}

export const FROM_DEFAULT =
  process.env.RESEND_FROM ?? '熙熙初日 <hello@ccbabylife.com>'
