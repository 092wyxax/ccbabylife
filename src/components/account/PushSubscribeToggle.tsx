'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  subscribePushAction,
  unsubscribePushAction,
} from '@/server/actions/push'
import { toast } from '@/components/shared/Toast'

interface Props {
  vapidPublicKey: string | null
}

type Status = 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed' | 'loading'

export function PushSubscribeToggle({ vapidPublicKey }: Props) {
  const [status, setStatus] = useState<Status>('loading')
  const [pending, start] = useTransition()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      setStatus(sub ? 'subscribed' : 'unsubscribed')
    })
  }, [])

  if (!vapidPublicKey) {
    return (
      <p className="text-xs text-ink-soft">
        瀏覽器推送尚未設定。
      </p>
    )
  }

  if (status === 'unsupported') {
    return (
      <p className="text-xs text-ink-soft">
        你的瀏覽器不支援推送通知。iPhone 用戶需先把網站「加到主畫面」。
      </p>
    )
  }

  if (status === 'denied') {
    return (
      <p className="text-xs text-warning">
        通知權限被拒絕。請到瀏覽器設定 → 網站權限 → ccbabylife.com 解鎖通知後重新整理。
      </p>
    )
  }

  async function subscribe() {
    if (!vapidPublicKey) return
    start(async () => {
      try {
        const reg = await navigator.serviceWorker.ready
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          if (permission === 'denied') setStatus('denied')
          toast.error('未授予通知權限')
          return
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        })
        const json = sub.toJSON()
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
          toast.error('訂閱失敗：金鑰缺失')
          return
        }
        const result = await subscribePushAction({
          endpoint: json.endpoint,
          p256dhKey: json.keys.p256dh,
          authKey: json.keys.auth,
          userAgent: navigator.userAgent.slice(0, 200),
        })
        if (result.error) {
          toast.error(result.error)
          return
        }
        setStatus('subscribed')
        toast.success('已開啟通知 🔔')
      } catch (e) {
        console.error(e)
        toast.error('訂閱失敗，請重試')
      }
    })
  }

  async function unsubscribe() {
    start(async () => {
      try {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await unsubscribePushAction(sub.endpoint)
          await sub.unsubscribe()
        }
        setStatus('unsubscribed')
        toast.success('已關閉通知')
      } catch (e) {
        console.error(e)
        toast.error('關閉失敗，請重試')
      }
    })
  }

  return (
    <div className="space-y-2">
      {status === 'subscribed' ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm">
            <span className="text-success">🔔 已開啟瀏覽器推送通知</span>
            <span className="block text-xs text-ink-soft mt-0.5">
              訂單狀態 / 限時優惠會即時送到這台裝置
            </span>
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={unsubscribe}
            className="text-xs text-ink-soft hover:text-danger underline whitespace-nowrap"
          >
            關閉
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            disabled={pending || status === 'loading'}
            onClick={subscribe}
            className="font-jp text-sm bg-ink text-cream px-4 py-2 rounded-md hover:bg-accent transition-colors disabled:opacity-50 tracking-wider"
          >
            {pending ? '處理中⋯' : '🔔 開啟瀏覽器推送通知'}
          </button>
          <p className="text-xs text-ink-soft mt-2 leading-relaxed">
            訂單狀態變更、新優惠會即時推播到瀏覽器（不靠 LINE）。隨時可關閉。
          </p>
        </div>
      )}
    </div>
  )
}

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(b64)
  const buf = new ArrayBuffer(raw.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i)
  return buf
}
