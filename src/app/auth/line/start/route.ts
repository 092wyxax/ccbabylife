import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const channelId = process.env.LINE_LOGIN_CHANNEL_ID
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!channelId || !siteUrl) {
    return NextResponse.redirect(
      new URL('/account?err=line-not-configured', request.url)
    )
  }

  const state =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)

  const store = await cookies()
  store.set('line_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: channelId,
    redirect_uri: `${siteUrl}/auth/line/callback`,
    state,
    scope: 'profile openid email',
  })

  return NextResponse.redirect(
    `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`
  )
}
