import Link from 'next/link'
import { INSTA_PICKS } from '@/lib/japan-content'

export const metadata = {
  title: '日本媽媽選書',
  description: '日本媽媽 Instagram 上每月討論最熱的選物。附原文 + 翻譯。',
}

export default function InstaPicksPage() {
  const sorted = [...INSTA_PICKS].sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : -1
  )

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-3">
        INSTA PICKS · ママさんセレクト
      </p>
      <h1 className="font-serif text-3xl sm:text-4xl mb-3 tracking-wide">
        日本媽媽社群選書
      </h1>
      <p className="text-ink-soft max-w-2xl leading-relaxed mb-2">
        每月由日本朋友從 Instagram 上挑出最熱議的母嬰選物。
        附上原文與翻譯，看日本媽媽對該款的真實感想，不是行銷文案。
      </p>
      <p className="font-jp text-xs text-ink-soft tracking-wider mb-10">
        毎月更新 · 月初 IG 社群熱議精選
      </p>

      <ul className="space-y-8">
        {sorted.map((p) => (
          <li
            key={p.publishedAt + p.igHandle}
            className="bg-white border border-line rounded-lg p-6"
          >
            <header className="flex items-baseline justify-between mb-4 pb-3 border-b border-line">
              <div>
                <p className="font-jp text-sm">
                  <span className="text-accent">@{p.igHandle}</span>
                  <span className="text-ink-soft ml-2 text-xs">
                    {p.igFollowerCount} フォロワー
                  </span>
                </p>
                <p className="font-jp text-xs text-ink-soft tracking-wider mt-1">
                  {new Date(p.publishedAt).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <a
                href={p.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-jp text-xs text-ink-soft hover:text-accent tracking-wider"
              >
                Instagram で見る →
              </a>
            </header>

            <blockquote className="border-l-2 border-accent pl-4 mb-4">
              <p className="font-jp text-base text-ink/90 leading-relaxed mb-2">
                「{p.originalQuoteJp}」
              </p>
              <p className="text-sm text-ink-soft leading-relaxed">
                「{p.translatedQuoteZh}」
              </p>
            </blockquote>

            <div className="flex items-baseline justify-between flex-wrap gap-3">
              <div>
                <p className="font-jp text-[11px] tracking-[0.2em] text-ink-soft mb-0.5">
                  推薦商品 · おすすめ
                </p>
                <p className="font-medium">{p.productNameZh}</p>
              </div>
              {p.ourProductSlug ? (
                <Link
                  href={`/shop/${p.ourProductSlug}`}
                  className="font-jp text-xs bg-ink text-cream px-4 py-2 rounded-md hover:bg-accent transition-colors tracking-wider"
                >
                  購入 · 看商品 →
                </Link>
              ) : (
                <span className="font-jp text-xs bg-warning/20 text-ink px-3 py-1.5 rounded-md tracking-wider">
                  📦 予約代購可
                </span>
              )}
            </div>

            {p.notes && (
              <p className="text-xs text-ink-soft mt-4 pt-3 border-t border-line italic leading-relaxed">
                {p.notes}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
