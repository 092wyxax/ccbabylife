'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

interface Props {
  initialBornAt: string | null
}

export function AgeRecommenderInput({ initialBornAt }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [bornAt, setBornAt] = useState(initialBornAt ?? '')
  const [pending, setPending] = useState(false)

  const submit = (value: string) => {
    if (!value) return
    setPending(true)
    const next = new URLSearchParams(params)
    next.set('bornAt', value)
    router.push(`/recommend?${next.toString()}`)
  }

  return (
    <div className="bg-white border border-line rounded-lg p-6">
      <p className="text-sm mb-3">妳家寶貝的出生年月：</p>
      <div className="flex gap-3">
        <input
          type="month"
          value={bornAt}
          onChange={(e) => setBornAt(e.target.value)}
          max={new Date().toISOString().slice(0, 7)}
          className="flex-1 border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
        />
        <button
          type="button"
          onClick={() => submit(bornAt)}
          disabled={!bornAt || pending}
          className="bg-ink text-cream px-5 py-2 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
        >
          {pending ? '計算中⋯' : '看推薦'}
        </button>
      </div>
      <p className="text-xs text-ink-soft mt-2">
        我們會依寶寶月齡，從目前選物中挑出適用的商品。資料只在妳的瀏覽器計算，不存到我們資料庫。
      </p>
    </div>
  )
}
