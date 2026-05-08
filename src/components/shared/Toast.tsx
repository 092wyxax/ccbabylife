'use client'

import { create } from 'zustand'
import { useEffect } from 'react'

type ToastKind = 'success' | 'error' | 'info'

interface Toast {
  id: string
  kind: ToastKind
  message: string
  /** Auto-dismiss in ms, 0 = persistent */
  ttl: number
}

interface ToastState {
  toasts: Toast[]
  push: (message: string, kind?: ToastKind, ttl?: number) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, kind = 'info', ttl = 3000) => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { id, kind, message, ttl }] }))
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Convenience helper: toast.success / .error / .info */
export const toast = {
  success: (msg: string, ttl?: number) =>
    useToastStore.getState().push(msg, 'success', ttl),
  error: (msg: string, ttl?: number) =>
    useToastStore.getState().push(msg, 'error', ttl ?? 5000),
  info: (msg: string, ttl?: number) =>
    useToastStore.getState().push(msg, 'info', ttl),
}

const KIND_STYLES: Record<ToastKind, string> = {
  success: 'bg-success text-cream',
  error: 'bg-danger text-cream',
  info: 'bg-ink text-cream',
}

const KIND_ICON: Record<ToastKind, string> = {
  success: '✓',
  error: '!',
  info: 'i',
}

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-[calc(100vw-32px)] sm:max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  )
}

function ToastItem({
  toast: t,
  onDismiss,
}: {
  toast: Toast
  onDismiss: () => void
}) {
  useEffect(() => {
    if (t.ttl <= 0) return
    const id = setTimeout(onDismiss, t.ttl)
    return () => clearTimeout(id)
  }, [t.ttl, onDismiss])

  return (
    <div
      role="status"
      className={
        'pointer-events-auto rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 text-sm animate-[fadeInRight_200ms_ease-out] ' +
        KIND_STYLES[t.kind]
      }
      style={{ animation: 'fadeInRight 200ms ease-out' }}
    >
      <span
        className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs flex-shrink-0"
        aria-hidden
      >
        {KIND_ICON[t.kind]}
      </span>
      <p className="flex-1 leading-snug">{t.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="text-white/70 hover:text-white text-lg leading-none -my-1 -mr-1 px-2"
        aria-label="關閉"
      >
        ×
      </button>
    </div>
  )
}
