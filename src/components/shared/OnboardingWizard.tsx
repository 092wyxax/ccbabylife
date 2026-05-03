'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const COOKIE = 'nihon_onboarded'

const STEPS = [
  {
    icon: '🏪',
    eyebrow: 'いらっしゃいませ',
    title: '歡迎來到熙熙初日',
    body: '我們是一家娃媽親選日系母嬰／寵物用品的小店。每週日截單、週一日本下單、約 10–14 天到貨。',
  },
  {
    icon: '📅',
    eyebrow: '予約制について',
    title: '什麼是「予約制 · 預購制」？',
    body: '你下單我們才去日本買 — 沒有囤貨、沒有水貨。週日 23:59 締切是固定節奏，每週一批集運回來。所以下單後請耐心等 10–14 天。',
  },
  {
    icon: '🇯🇵',
    eyebrow: '日本のいま',
    title: '看日本當下流行什麼？',
    body: '「日本熱賣榜」— 每週更新樂天 / Amazon JP 熱銷榜。「媽媽選書」— 日本 IG 媽媽社群熱議精選。「季節限定」— 各都道府縣四季限定品。',
  },
]

export function OnboardingWizard() {
  const [show, show_] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    // Read cookie client-side
    const has = document.cookie.split('; ').some((c) => c.startsWith(`${COOKIE}=1`))
    if (!has) show_(true)
  }, [])

  const dismiss = () => {
    document.cookie = `${COOKIE}=1; path=/; max-age=${365 * 24 * 60 * 60}; samesite=lax`
    show_(false)
  }

  if (!show) return null

  const s = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50" onClick={dismiss} />
      <div className="relative bg-cream border border-line rounded-2xl max-w-md w-full p-8 shadow-xl">
        <div className="text-5xl mb-4 text-center">{s.icon}</div>
        <p className="font-jp text-xs tracking-[0.3em] text-ink-soft text-center mb-2">
          {s.eyebrow}
        </p>
        <h2 className="font-serif text-2xl text-center mb-3 tracking-wide">{s.title}</h2>
        <p className="text-sm text-ink-soft text-center leading-relaxed mb-6">
          {s.body}
        </p>

        <div className="flex justify-center gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={
                'w-2 h-2 rounded-full ' +
                (i === step ? 'bg-ink' : 'bg-line')
              }
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="font-jp flex-1 border border-line py-2.5 rounded-md text-sm hover:border-ink tracking-wider"
          >
            後で · 稍後再看
          </button>
          {isLast ? (
            <Link
              href="/trending"
              onClick={dismiss}
              className="font-jp flex-1 bg-ink text-cream py-2.5 rounded-md text-sm hover:bg-accent text-center transition-colors tracking-wider"
            >
              日本熱賣榜 →
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="font-jp flex-1 bg-ink text-cream py-2.5 rounded-md text-sm hover:bg-accent transition-colors tracking-wider"
            >
              次へ · 下一步
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
