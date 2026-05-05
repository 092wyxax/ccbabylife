'use client'

import { useActionState, useEffect, useState, useRef } from 'react'
import {
  grantCouponAction,
  searchCustomersForGrantAction,
  type GrantCouponState,
  type CustomerSearchResult,
} from '@/server/actions/coupons'

interface Props {
  couponId: string
}

export function CouponGrantForm({ couponId }: Props) {
  const boundAction = grantCouponAction.bind(null, couponId)
  const [state, formAction, pending] = useActionState<GrantCouponState, FormData>(
    boundAction,
    {}
  )

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CustomerSearchResult[]>([])
  const [selected, setSelected] = useState<CustomerSearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 1) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchCustomersForGrantAction(query)
        setResults(data)
      } catch {
        setResults([])
      }
    }, 200)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // Clear after success
  useEffect(() => {
    if (!pending && state.granted !== undefined && !state.error) {
      setSelected([])
      setQuery('')
    }
  }, [pending, state])

  const addCustomer = (c: CustomerSearchResult) => {
    if (selected.find((s) => s.id === c.id)) return
    setSelected([...selected, c])
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  const removeCustomer = (id: string) => {
    setSelected(selected.filter((s) => s.id !== id))
  }

  const filteredResults = results.filter(
    (r) => !selected.find((s) => s.id === r.id)
  )

  return (
    <div className="space-y-4">
      {state.error && (
        <div className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
          {state.error}
        </div>
      )}

      {(state.granted !== undefined || state.alreadyHad) && (
        <div className="bg-success/10 border border-success/40 text-ink text-sm p-3 rounded-md space-y-1">
          {state.granted! > 0 && (
            <p>✓ 成功發放給 {state.granted} 位會員</p>
          )}
          {state.alreadyHad! > 0 && (
            <p className="text-ink-soft">
              · {state.alreadyHad} 位已經擁有此優惠券，已跳過
            </p>
          )}
        </div>
      )}

      <div className="relative">
        <label className="block text-xs text-ink-soft mb-1.5">
          搜尋會員（姓名或 Email）
        </label>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowResults(true)
          }}
          onFocus={() => setShowResults(true)}
          placeholder="輸入名字或 Email 開始搜尋..."
          className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink text-sm"
        />

        {showResults && query.trim().length > 0 && (
          <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-line rounded-md shadow-lg max-h-72 overflow-y-auto">
            {filteredResults.length === 0 ? (
              <p className="px-3 py-2 text-sm text-ink-soft">
                沒有符合的會員
              </p>
            ) : (
              filteredResults.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => addCustomer(c)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-cream-50 border-b border-line last:border-b-0"
                >
                  <div className="font-medium">{c.name ?? '(未填名字)'}</div>
                  <div className="text-xs text-ink-soft">{c.email}</div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <div>
          <p className="text-xs text-ink-soft mb-2">
            已選 {selected.length} 位：
          </p>
          <div className="flex flex-wrap gap-2">
            {selected.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 bg-ink text-cream text-xs px-2 py-1 rounded-full"
              >
                {c.name ?? c.email}
                <button
                  type="button"
                  onClick={() => removeCustomer(c.id)}
                  className="hover:bg-cream/20 rounded-full w-4 h-4 flex items-center justify-center"
                  aria-label={`移除 ${c.name ?? c.email}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <form action={formAction}>
        {selected.map((c) => (
          <input key={c.id} type="hidden" name="customerIds" value={c.id} />
        ))}
        <button
          type="submit"
          disabled={pending || selected.length === 0}
          className="w-full bg-ink text-cream py-2.5 rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50"
        >
          {pending
            ? '發放中⋯'
            : selected.length === 0
            ? '請先選擇會員'
            : `發放給 ${selected.length} 位會員`}
        </button>
      </form>
    </div>
  )
}
