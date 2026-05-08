/* eslint-disable no-restricted-globals */
/**
 * Service worker for PWA + Web Push.
 * Bumped CACHE_VERSION whenever you ship breaking SW changes.
 */
const CACHE_VERSION = 'v1'
const RUNTIME_CACHE = `ccbabylife-runtime-${CACHE_VERSION}`

self.addEventListener('install', (event) => {
  // Activate this SW immediately on install (no need to wait for tabs to close)
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Take over open clients on activation
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((k) => k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
      await self.clients.claim()
    })()
  )
})

/**
 * Network-first runtime cache for GET navigations + same-origin static assets.
 * Falls back to cache when offline. NEVER caches POST / API mutations.
 */
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  // Skip Next.js HMR + admin
  if (url.pathname.startsWith('/_next/webpack-hmr')) return
  if (url.pathname.startsWith('/admin')) return
  if (url.pathname.startsWith('/api/')) return

  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(request)
        // Only cache successful responses
        if (fresh.ok && fresh.type === 'basic') {
          const cache = await caches.open(RUNTIME_CACHE)
          cache.put(request, fresh.clone())
        }
        return fresh
      } catch (err) {
        const cache = await caches.open(RUNTIME_CACHE)
        const cached = await cache.match(request)
        if (cached) return cached
        // Last resort: minimal offline HTML
        if (request.mode === 'navigate') {
          return new Response(
            '<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>離線</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;padding:2rem;background:#faf7f2;color:#2d2a26"><div><h1 style="font-family:serif;font-size:1.5rem;margin-bottom:.5rem">目前無法連線</h1><p style="color:#7a756f">網路恢復後請重試</p></div></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          )
        }
        throw err
      }
    })()
  )
})

/* ─────────────────── Web Push handlers ─────────────────── */

self.addEventListener('push', (event) => {
  let payload = { title: '熙熙初日', body: '有新通知' }
  try {
    if (event.data) payload = event.data.json()
  } catch {
    if (event.data) payload.body = event.data.text()
  }

  const { title, body, icon, badge, tag, data, actions } = payload
  event.waitUntil(
    self.registration.showNotification(title || '熙熙初日', {
      body: body || '',
      icon: icon || '/icon.svg',
      badge: badge || '/icon.svg',
      tag: tag || 'general',
      data: data || {},
      actions: actions || [],
      renotify: false,
      requireInteraction: false,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      // Focus existing tab if same origin
      for (const client of allClients) {
        const clientUrl = new URL(client.url)
        if (clientUrl.origin === self.location.origin && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Otherwise open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })()
  )
})
