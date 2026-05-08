import { NextRequest, NextResponse } from 'next/server'
import {
  dispatchQueuedPushes,
  requeueOldFailures,
} from '@/server/services/NotificationService'
import { dispatchCutoffReminders } from '@/server/services/CutoffReminder'
import { processDueSubscriptions } from '@/server/services/SubscriptionService'

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

  // Cutoff reminder fires self-only when within 6h of next Sunday 23:59 TPE.
  // Cron runs daily at 21:00 TPE → on Sundays we're 2h59m from cutoff = inside window.
  let cutoffPushed = 0
  try {
    const r = await dispatchCutoffReminders()
    cutoffPushed = r.pushed
  } catch (e) {
    console.error('[dispatch-pushes] cutoff reminder failed:', e)
  }

  // Process due subscriptions (fires only when nextRunAt has passed)
  let subsOrdered = 0
  try {
    const r = await processDueSubscriptions()
    subsOrdered = r.ordered
  } catch (e) {
    console.error('[dispatch-pushes] subscription processing failed:', e)
  }

  const result = await dispatchQueuedPushes({ limit: 200 })

  return NextResponse.json({
    requeued,
    cutoffPushed,
    subsOrdered,
    ...result,
    timestamp: new Date().toISOString(),
  })
}
