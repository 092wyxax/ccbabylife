'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { searchSuggestionsAction, type SearchSuggestion } from '@/server/actions/search'
import { imageUrl } from '@/lib/image'
import { formatTwd } from '@/lib/format'

const RECENT_KEY = 'recent_searches'
const MAX_RECENT = 5

interface Props {
  initialQuery: string
  /** Plain serializable params from server — preserves filters when q changes */
  preserveParams?: Record<string, string | undefined>
}

function buildHref(
  preserve: Record<string, string | undefined> | undefined,
  q: string
): string {
  const sp = new URLSearchParams()
  if (preserve) {
    for (const [k, v] of Object.entries(preserve)) {
      if (v) sp.set(k, v)
    }
  }
  if (q) sp.set('q', q)
  sp.delete('page')
  const qs = sp.toString()
  return qs ? `/shop?${qs}` : '/shop'
}

export function LiveSearchBar({ initialQuery, preserveParams }: Props) {
  const [q, setQ] = useState(initialQuery)
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [recents, setRecents] = useState<string[]>([])
  const router = useRouter()
  const wrapRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load recents on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY)
      if (raw) setRecents(JSON.parse(raw))
    } catch {}
  }, [])

  // Click outside closes
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  // Debounced fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await searchSuggestionsAction(q.trim(), 5)
        setSuggestions(r)
      } catch {
        setSuggestions([])
      }
    }, 220)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [q])

  function commitSearch(query: string) {
    const trimmed = query.trim()
    if (trimmed) {
      // record in recents
      const next = [trimmed, ...recents.filter((r) => r !== trimmed)].slice(0, MAX_RECENT)
      setRecents(next)
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      } catch {}
    }
    setOpen(false)
    router.push(buildHref(preserveParams, trimmed))
  }

  function clearRecents() {
    setRecents([])
    try {
      localStorage.removeItem(RECENT_KEY)
    } catch {}
  }

  return (
    <div ref={wrapRef} className="relative max-w-md">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          commitSearch(q)
        }}
      >
        <div className="relative">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="搜尋商品、品牌、關鍵字…"
            className="w-full pl-10 pr-9 py-2.5 border border-line rounded-md focus:outline-none focus:border-ink text-sm bg-white"
          />
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ('')
                setSuggestions([])
              }}
              aria-label="清除"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink-soft hover:text-ink px-2 py-1 rounded"
            >
              ✕
            </button>
          )}
        </div>
      </form>

      {open && (q.trim() || recents.length > 0) && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-white border border-line rounded-lg shadow-lg overflow-hidden z-20">
          {q.trim() && suggestions.length > 0 && (
            <ul className="divide-y divide-line">
              {suggestions.map((s) => (
                <li key={s.productId}>
                  <Link
                    href={`/shop/${s.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-cream-50"
                  >
                    <div className="w-10 h-10 flex-shrink-0 bg-cream-100 rounded-md overflow-hidden">
                      {s.imagePath && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl(s.imagePath)}
                          alt={s.nameZh}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{s.nameZh}</p>
                      <p className="text-xs text-ink-soft">{formatTwd(s.priceTwd)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {q.trim() && (
            <button
              type="button"
              onClick={() => commitSearch(q)}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-cream-50 border-t border-line text-ink-soft"
            >
              ↵ 看「<span className="text-ink">{q}</span>」全部結果
            </button>
          )}

          {!q.trim() && recents.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-3 py-2 text-xs text-ink-soft border-b border-line">
                <span>最近搜尋</span>
                <button
                  type="button"
                  onClick={clearRecents}
                  className="hover:text-danger underline"
                >
                  清除
                </button>
              </div>
              <ul>
                {recents.map((r) => (
                  <li key={r}>
                    <button
                      type="button"
                      onClick={() => commitSearch(r)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-cream-50 flex items-center gap-2"
                    >
                      <span className="text-ink-soft">↶</span>
                      <span>{r}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {q.trim() && suggestions.length === 0 && (
            <p className="px-3 py-3 text-sm text-ink-soft text-center">
              沒有找到相符商品
            </p>
          )}
        </div>
      )}
    </div>
  )
}
