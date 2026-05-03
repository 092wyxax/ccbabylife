import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream text-ink px-6 text-center">
      <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-4">
        404 · ページが見つかりません
      </p>
      <h1 className="font-serif text-4xl mb-3 tracking-wide">找不到這個頁面</h1>
      <p className="text-ink-soft text-sm max-w-md leading-relaxed mb-8">
        商品可能已下架，或網址打錯。回到首頁逛逛這週的選物，或私訊我們的 LINE 客服。
      </p>
      <div className="flex flex-wrap gap-3 justify-center text-sm">
        <Link
          href="/"
          className="font-jp bg-ink text-cream px-5 py-3 hover:bg-accent transition-colors tracking-wider"
        >
          ホームへ · 回首頁
        </Link>
        <Link
          href="/shop"
          className="font-jp border border-line px-5 py-3 hover:border-ink transition-colors tracking-wider"
        >
          全商品 · 所有選物
        </Link>
        <Link
          href="/faq"
          className="font-jp border border-line px-5 py-3 hover:border-ink transition-colors tracking-wider"
        >
          よくある質問 · 常見問題
        </Link>
      </div>
    </div>
  )
}
