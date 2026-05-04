import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { customers } from '@/db/schema'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { setCustomerSession } from '@/lib/customer-session'

function err(req: NextRequest, code: string) {
  return NextResponse.redirect(new URL(`/account?err=${code}`, req.url))
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code) return err(request, 'no-code')

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user.email) {
    return err(request, error?.message ? encodeURIComponent(error.message) : 'no-email')
  }

  const email = data.user.email.toLowerCase()
  const fullName =
    (data.user.user_metadata?.full_name as string | undefined) ??
    (data.user.user_metadata?.name as string | undefined) ??
    null

  const [existing] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.orgId, DEFAULT_ORG_ID), eq(customers.email, email)))
    .limit(1)

  let customerId: string
  if (existing) {
    if (existing.isBlacklisted) {
      await supabase.auth.signOut()
      return err(request, 'blacklisted')
    }
    customerId = existing.id
    if (fullName && !existing.name) {
      await db
        .update(customers)
        .set({ name: fullName, updatedAt: new Date() })
        .where(eq(customers.id, existing.id))
    }
  } else {
    const [created] = await db
      .insert(customers)
      .values({
        orgId: DEFAULT_ORG_ID,
        email,
        name: fullName,
      })
      .returning()
    customerId = created.id
  }

  await setCustomerSession({ customerId, email })
  // We use our own customer-session JWT, not Supabase session, for customers.
  await supabase.auth.signOut()

  return NextResponse.redirect(new URL('/account', request.url))
}
