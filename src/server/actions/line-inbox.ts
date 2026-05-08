'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireRole } from '@/server/services/AdminAuthService'
import {
  sendReply,
  markThreadRead,
} from '@/server/services/LineInboxService'

const replySchema = z.object({
  lineUserId: z.string().min(1),
  text: z.string().min(1).max(2000),
})

export async function sendReplyAction(formData: FormData): Promise<void> {
  await requireRole(['owner', 'manager', 'ops'])
  const parsed = replySchema.safeParse({
    lineUserId: formData.get('lineUserId'),
    text: formData.get('text'),
  })
  if (!parsed.success) return
  try {
    await sendReply(parsed.data.lineUserId, parsed.data.text)
  } catch (e) {
    console.error('[sendReplyAction] failed:', e)
  }
  revalidatePath('/admin/inbox')
  revalidatePath(`/admin/inbox/${parsed.data.lineUserId}`)
}

export async function markReadAction(formData: FormData): Promise<void> {
  await requireRole(['owner', 'manager', 'ops'])
  const lineUserId = String(formData.get('lineUserId') ?? '')
  if (!lineUserId) return
  await markThreadRead(lineUserId)
  revalidatePath('/admin/inbox')
}
