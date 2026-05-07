import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { and, eq, or } from 'drizzle-orm'
import { jwtVerify } from 'jose'
import { db } from '@/db/client'
import { customers } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { setCustomerSession } from '@/lib/customer-session'
import { issueAutoCoupons } from '@/server/services/AutoCouponService'

function err(req: NextRequest, code: string) {
  return NextResponse.redirect(new URL(`/account?err=${code}`, req.url))
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  if (!code || !state) return err(request, 'line-no-code')

  const store = await cookies()
  const expected = store.get('line_oauth_state')?.value
  store.delete('line_oauth_state')
  if (!expected || state !== expected) return err(request, 'state-mismatch')

  const channelId = process.env.LINE_LOGIN_CHANNEL_ID
  const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!channelId || !channelSecret || !siteUrl) {
    return err(request, 'line-not-configured')
  }

  // Exchange code for token
  const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${siteUrl}/auth/line/callback`,
      client_id: channelId,
      client_secret: channelSecret,
    }),
  })
  if (!tokenRes.ok) {
    const detail = await tokenRes.text()
    console.error('LINE token exchange failed:', detail)
    return err(request, 'line-token-fail')
  }
  const tokenData = (await tokenRes.json()) as {
    access_token: string
    id_token: string
  }

  // LINE Login signs id_token with HS256 using the channel secret as a
  // symmetric key (NOT JWKS / RS256).
  let lineUserId: string
  let email: string | null
  let name: string | null
  try {
    const secret = new TextEncoder().encode(channelSecret)
    const { payload } = await jwtVerify(tokenData.id_token, secret, {
      issuer: 'https://access.line.me',
      audience: channelId,
      algorithms: ['HS256'],
    })
    lineUserId = payload.sub as string
    email = (payload.email as string | undefined)?.toLowerCase() ?? null
    name = (payload.name as string | undefined) ?? null
  } catch (e) {
    console.error('LINE id_token verify failed:', e)
    return err(request, 'line-jwt-invalid')
  }

  // Find by LINE userId, or by email if available
  const [existing] = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.orgId, DEFAULT_ORG_ID),
        email
          ? or(
              eq(customers.lineUserId, lineUserId),
              eq(customers.email, email)
            )!
          : eq(customers.lineUserId, lineUserId)
      )
    )
    .limit(1)

  let customerId: string
  let customerEmail: string

  if (existing) {
    if (existing.isBlacklisted) return err(request, 'blacklisted')
    customerId = existing.id
    customerEmail = existing.email
    // Backfill lineUserId / name if missing
    const patch: Record<string, unknown> = {}
    if (!existing.lineUserId) patch.lineUserId = lineUserId
    if (!existing.name && name) patch.name = name
    if (Object.keys(patch).length > 0) {
      await db
        .update(customers)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(customers.id, existing.id))
    }
  } else {
    if (!email) {
      // LINE didn't return email — Email scope likely not approved yet
      return err(request, 'line-no-email')
    }
    const [created] = await db
      .insert(customers)
      .values({
        orgId: DEFAULT_ORG_ID,
        email,
        name,
        lineUserId,
      })
      .returning()
    customerId = created.id
    customerEmail = email
    await issueAutoCoupons('signup', [customerId]).catch((e) => {
      console.error('[line-callback] signup coupon issue failed:', e)
    })
  }

  await setCustomerSession({ customerId, email: customerEmail })

  const cookieStore = await cookies()
  const next = cookieStore.get('line_oauth_next')?.value
  cookieStore.delete('line_oauth_next')
  const dest = next && next.startsWith('/') ? next : '/account'
  return NextResponse.redirect(new URL(dest, request.url))
}
