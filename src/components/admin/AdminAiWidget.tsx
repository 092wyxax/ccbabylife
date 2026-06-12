'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, X, Send, ArrowRight, Ticket } from 'lucide-react'
import type { AiProposal } from '@/server/services/AdminAiService'

interface Turn {
  role: 'user' | 'assistant'
  content: string
  proposals?: AiProposal[]
}

type ProposalRunState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'done'; message: string }
  | { status: 'error'; message: string }
  | { status: 'dismissed' }

const SUGGESTIONS = [
  '今天有什麼待辦？',
  '要怎麼幫訂單出貨？',
  '怎麼上架新商品？',
  '這個月營收多少？',
  '哪些現貨快沒庫存了？',
]

export function AdminAiWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // key: `${msgIndex}:${proposalIndex}`
  const [runs, setRuns] = useState<Record<string, ProposalRunState>>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, loading, runs])

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
        // 只送最近 20 輪文字（提案卡片不需回送）
        body: JSON.stringify({
          messages: next.slice(-20).map(({ role, content }) => ({ role, content })),
        }),
      })
      const data = (await res.json()) as {
        text?: string
        proposals?: AiProposal[]
        error?: string
      }
      if (!res.ok || !data.text) {
        setError(data.error ?? 'AI 回覆失敗，請稍後再試')
      } else {
        setMessages([
          ...next,
          { role: 'assistant', content: data.text, proposals: data.proposals },
        ])
      }
    } catch {
      setError('連線失敗，請檢查網路後再試')
    } finally {
      setLoading(false)
    }
  }

  async function executeProposal(key: string, proposal: AiProposal) {
    setRuns((r) => ({ ...r, [key]: { status: 'running' } }))
    try {
      const res = await fetch('/api/admin/ai-execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal }),
      })
      const data = (await res.json()) as { message?: string; error?: string }
      if (!res.ok || !data.message) {
        setRuns((r) => ({
          ...r,
          [key]: { status: 'error', message: data.error ?? '執行失敗' },
        }))
      } else {
        setRuns((r) => ({ ...r, [key]: { status: 'done', message: data.message! } }))
      }
    } catch {
      setRuns((r) => ({ ...r, [key]: { status: 'error', message: '連線失敗' } }))
    }
  }

  return (
    <>
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

      {open && (
        <div className="fixed z-50 bg-white border border-line shadow-2xl flex flex-col inset-0 sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[400px] sm:h-[560px] sm:rounded-xl overflow-hidden">
          <header className="flex items-center justify-between px-4 py-3 border-b border-line bg-cream-100 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={16} />
              <span className="text-sm font-medium">AI 小幫手</span>
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
                  我可以教妳怎麼用後台、查營收訂單庫存、幫忙想文案；
                  出貨和發券我會先擬好，妳按「執行」才會生效 ✨
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

            {messages.map((m, mi) => (
              <div key={mi}>
                <div
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

                {m.proposals?.map((p, pi) => {
                  const key = `${mi}:${pi}`
                  const run = runs[key] ?? { status: 'idle' }
                  if (run.status === 'dismissed') return null
                  return (
                    <ProposalCard
                      key={key}
                      proposal={p}
                      run={run}
                      onExecute={() => executeProposal(key, p)}
                      onDismiss={() =>
                        setRuns((r) => ({ ...r, [key]: { status: 'dismissed' } }))
                      }
                    />
                  )
                })}
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

function ProposalCard({
  proposal,
  run,
  onExecute,
  onDismiss,
}: {
  proposal: AiProposal
  run: ProposalRunState
  onExecute: () => void
  onDismiss: () => void
}) {
  return (
    <div className="mt-2 ml-1 mr-6 border border-accent/40 bg-accent/5 rounded-xl p-3.5 text-sm space-y-2.5">
      {proposal.kind === 'order_status' ? (
        <>
          <p className="text-xs text-ink-soft flex items-center gap-1.5">
            <ArrowRight size={13} /> 訂單狀態變更提案
          </p>
          <p className="leading-relaxed">
            <span className="font-mono text-xs">{proposal.orderNumber}</span>
            {proposal.customerName && (
              <span className="text-ink-soft">（{proposal.customerName}）</span>
            )}
            <br />
            <span className="text-ink-soft">{proposal.fromLabel}</span>
            <span className="mx-1.5">→</span>
            <span className="font-medium">{proposal.toLabel}</span>
          </p>
          <p className="text-[11px] text-ink-soft">執行後系統會自動 LINE 通知客人</p>
        </>
      ) : (
        <>
          <p className="text-xs text-ink-soft flex items-center gap-1.5">
            <Ticket size={13} /> 發放優惠券提案
          </p>
          <p className="leading-relaxed">
            <span className="font-mono">{proposal.couponCode}</span>
            <span className="text-ink-soft">（{proposal.couponDesc}）</span>
            <br />
            發給 {proposal.customers.length} 位：
            {proposal.customers.map((c) => c.name ?? c.email).join('、')}
          </p>
          <p className="text-[11px] text-ink-soft">發放後會自動 LINE / Email 通知；已領過的會自動略過</p>
        </>
      )}

      {run.status === 'done' ? (
        <p className="text-xs text-success bg-white border border-line rounded-md px-2.5 py-1.5">
          {run.message}
        </p>
      ) : (
        <div className="space-y-1.5">
          {run.status === 'error' && (
            <p className="text-xs text-danger">{run.message}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={onExecute}
              disabled={run.status === 'running'}
              className="bg-ink text-cream text-xs px-4 py-1.5 rounded-md hover:bg-accent disabled:opacity-50"
            >
              {run.status === 'running' ? '執行中⋯' : '執行'}
            </button>
            <button
              onClick={onDismiss}
              disabled={run.status === 'running'}
              className="border border-line text-xs px-3 py-1.5 rounded-md hover:border-ink text-ink-soft disabled:opacity-50"
            >
              略過
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
