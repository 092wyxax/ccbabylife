import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'nihon_customer_session'
const SESSION_DAYS = 30

export interface CustomerSession {
  customerId: string
  email: string
}

function getKey(): Uint8Array {
  const secret = process.env.LINE_JWT_SECRET
  if (!secret) throw new Error('LINE_JWT_SECRET not set')
  return new TextEncoder().encode(secret)
}

export async function setCustomerSession(session: CustomerSession): Promise<void> {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getKey())

  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: '/',
  })
}

export async function clearCustomerSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getKey())
    if (typeof payload.customerId !== 'string' || typeof payload.email !== 'string') {
      return null
    }
    return { customerId: payload.customerId, email: payload.email }
  } catch {
    return null
  }
}
