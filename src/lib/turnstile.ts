import 'server-only'

const SECRET = process.env.TURNSTILE_SECRET_KEY

export async function verifyTurnstile(token: string | undefined | null): Promise<boolean> {
  if (!SECRET) return true
  if (!token) return false

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret: SECRET, response: token }),
  })
  if (!res.ok) return false
  const data = (await res.json()) as { success?: boolean }
  return data.success === true
}
