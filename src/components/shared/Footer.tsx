import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-line bg-cream-100 mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 grid gap-8 sm:grid-cols-3 text-sm">
        <div>
          <h3 className="font-serif text-lg mb-3">日系選物店</h3>
          <p className="text-ink-soft leading-relaxed">
            1 歲娃媽親身試用、嚴選日系好物。<br />
            預購制：每週日截單，10–14 天到貨。
          </p>
        </div>

        <div>
          <h4 className="font-medium mb-3 text-ink-soft uppercase text-xs tracking-widest">
            選物
          </h4>
          <ul className="space-y-2">
            <li><Link href="/shop" className="hover:text-accent">所有商品</Link></li>
            <li><Link href="/recommend" className="hover:text-accent">月齡推薦器</Link></li>
            <li><Link href="/gift-guide" className="hover:text-accent">彌月禮指南</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium mb-3 text-ink-soft uppercase text-xs tracking-widest">
            關於
          </h4>
          <ul className="space-y-2">
            <li><Link href="/about" className="hover:text-accent">品牌故事 + 法規誠信</Link></li>
            <li><Link href="/faq" className="hover:text-accent">常見問題</Link></li>
            <li><Link href="/journal" className="hover:text-accent">媽媽真心話</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between gap-2 text-xs text-ink-soft">
          <span>© {new Date().getFullYear()} 日系選物店 · 統編 60766849</span>
          <span>不販售需查驗登記商品 · 所有商品為日本平行輸入個人選物</span>
        </div>
      </div>
    </footer>
  )
}
