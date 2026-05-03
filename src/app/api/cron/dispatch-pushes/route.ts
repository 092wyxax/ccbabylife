import { NextRequest, NextResponse } from 'next/server'
import {
  dispatchQueuedPushes,
  requeueOldFailures,
} from '@/server/services/NotificationService'

/**
 * Cron entry: dispatch all queued LINE pushes.
 * Also re-queues failed pushes older than 1 hour (likely transient errors).
 *
 * vercel.json schedule: every 10 minutes.
 * Secured by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    auth !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const requeued = await requeueOldFailures({
    olderThanMs: 60 * 60 * 1000,
    limit: 50,
  })
  const result = await dispatchQueuedPushes({ limit: 200 })

  return NextResponse.json({
    requeued,
    ...result,
    timestamp: new Date().toISOString(),
  })
}
