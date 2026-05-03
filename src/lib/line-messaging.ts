import 'server-only'

const PUSH_URL = 'https://api.line.me/v2/bot/message/push'
const MULTICAST_URL = 'https://api.line.me/v2/bot/message/multicast'

export interface LineTextMessage {
  type: 'text'
  text: string
}

export type LineMessage = LineTextMessage

export class LineApiError extends Error {
  constructor(
    public statusCode: number,
    public details: string,
    public retryAfterMs: number | null
  ) {
    super(`LINE API ${statusCode}: ${details}`)
    this.name = 'LineApiError'
  }
}

function getToken(): string {
  const t = process.env.LINE_MESSAGING_ACCESS_TOKEN
  if (!t) throw new Error('LINE_MESSAGING_ACCESS_TOKEN not configured')
  return t
}

export function isLineConfigured(): boolean {
  return Boolean(process.env.LINE_MESSAGING_ACCESS_TOKEN)
}

/**
 * Push a single message to one LINE user.
 * Costs 1 push from your monthly quota.
 */
export async function pushText(lineUserId: string, text: string): Promise<void> {
  const res = await fetch(PUSH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text: text.slice(0, 5000) }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    const retryAfter = res.headers.get('retry-after')
    throw new LineApiError(
      res.status,
      body,
      retryAfter ? Number(retryAfter) * 1000 : null
    )
  }
}

/**
 * Multicast (max 500 IDs per call). Costs 1 push per recipient.
 */
export async function multicastText(
  lineUserIds: string[],
  text: string
): Promise<void> {
  if (lineUserIds.length === 0) return
  if (lineUserIds.length > 500) {
    throw new Error('multicastText: max 500 recipients per call')
  }

  const res = await fetch(MULTICAST_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: lineUserIds,
      messages: [{ type: 'text', text: text.slice(0, 5000) }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new LineApiError(res.status, body, null)
  }
}
