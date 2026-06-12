'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, X, Send } from 'lucide-react'

interface Turn {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  '今天有什麼待辦？',
  '這個月營收多少？',
  '最近 30 天哪些商品最熱賣？',
  '哪些現貨快沒庫存了？',
]

export function AdminAiWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, loading])

  async function send(text: string) {
    const content = text.trim()
    if (!content || loading) return
    setError(null)
    const next: Turn[] = [...messages, { role: 'user', content }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 只送最近 20 輪，避免 payload 無限長大
        body: JSON.stringify({ messages: next.slice(-20) }),
      })
      const data = (await res.json()) as { text?: string; error?: string }
      if (!res.ok || !data.text) {
        setError(data.error ?? 'AI 回覆失敗，請稍後再試')
      } else {
        setMessages([...next, { role: 'assistant', content: data.text }])
      }
    } catch {
      setError('連線失敗，請檢查網路後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* 浮動按鈕 */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="開啟 AI 小幫手"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-ink text-cream rounded-full pl-3.5 pr-4 py-3 shadow-lg hover:bg-accent transition-colors"
        >
          <Sparkles size={18} />
          <span className="text-sm hidden sm:inline">AI 小幫手</span>
        </button>
      )}

      {/* 對話面板 */}
      {open && (
        <div className="fixed z-50 bg-white border border-line shadow-2xl flex flex-col inset-0 sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[400px] sm:h-[560px] sm:rounded-xl overflow-hidden">
          <header className="flex items-center justify-between px-4 py-3 border-b border-line bg-cream-100 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={16} />
              <span className="text-sm font-medium">AI 小幫手</span>
              <span className="text-[10px] text-ink-soft border border-line rounded-full px-1.5 py-0.5">
                查詢版
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="關閉"
              className="text-ink-soft hover:text-ink p-1"
            >
              <X size={18} />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-ink-soft leading-relaxed">
                  我可以幫妳查營收、訂單、庫存、熱賣商品，也可以幫忙想文案 ✨
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-xs border border-line rounded-full px-3 py-1.5 hover:border-ink hover:bg-cream-50 text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={
                    'max-w-[85%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ' +
                    (m.role === 'user'
                      ? 'bg-ink text-cream rounded-br-md'
                      : 'bg-cream-100 text-ink rounded-bl-md')
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-cream-100 px-3.5 py-2 rounded-2xl rounded-bl-md text-sm text-ink-soft animate-pulse">
                  查資料中⋯
                </div>
              </div>
            )}
            {error && <p className="text-xs text-danger px-1">{error}</p>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="border-t border-line p-3 flex gap-2 shrink-0"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="問我任何店務問題⋯"
              maxLength={2000}
              className="flex-1 border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-ink"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="送出"
              className="bg-ink text-cream px-3.5 rounded-md hover:bg-accent disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
