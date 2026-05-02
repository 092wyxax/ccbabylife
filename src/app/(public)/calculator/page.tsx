import Link from 'next/link'
import { PriceCalculator } from '@/components/tools/PriceCalculator'

export const metadata = {
  title: '日本代購報價計算機 | 日系選物店',
  description:
    '輸入日本商品價格與重量，30 秒估算台灣售價。包含匯率、國際運費、服務費、合理利潤的完整公式。',
}

export default function CalculatorPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-ink-soft mb-3">
          Tool · 透明定價
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl mb-3">
          日本代購報價計算機
        </h1>
        <p className="text-ink-soft max-w-2xl leading-relaxed">
          輸入日本商品價格與重量，30 秒估算台灣售價。
          公式對所有人公開：日幣 × 匯率 + 運費 + 服務費 + 利潤，
          無隱藏費用，<Link href="/about" className="underline hover:text-accent">為什麼我們敢公開</Link>。
        </p>
      </header>

      <PriceCalculator />

      <section className="mt-16 bg-cream-100 border border-line rounded-lg p-8">
        <h2 className="font-serif text-xl mb-3">這個價格是怎麼算的？</h2>
        <ul className="text-sm leading-relaxed text-ink-soft space-y-2 list-disc list-inside">
          <li>匯率：以台灣銀行現金賣出價 × 1.02 緩衝（吸收日圓波動 + 信用卡匯費）</li>
          <li>國際運費：依重量級距估算（500g 內海運 NT$80 起，依此類推）</li>
          <li>服務費：依商品單價分四級（NT$50 / 80 / 150 / 250），補貼選品時間與報關</li>
          <li>利潤率：依商品類別（母嬰 30–35%、寵物 25–30%、限定品 40–50%）</li>
          <li>進位：四捨五入到 10 / 50 / 100 元級距</li>
          <li>底線：單件毛利至少 NT$80（小單避免做白工）</li>
        </ul>
        <p className="text-xs text-ink-soft mt-4">
          完整公式說明見專案內部文件 <code className="text-xs">docs/PRICING_FORMULA.md</code>。
        </p>
      </section>

      <section className="mt-8 grid sm:grid-cols-3 gap-4 text-sm">
        <div className="bg-white border border-line rounded-lg p-5">
          <p className="font-medium mb-1">看到喜歡的就下單</p>
          <p className="text-ink-soft text-xs leading-relaxed">
            我們官網列的就是當週可預購商品。
          </p>
          <Link
            href="/shop"
            className="inline-block mt-3 text-xs text-accent hover:underline"
          >
            逛逛這週選物 →
          </Link>
        </div>
        <div className="bg-white border border-line rounded-lg p-5">
          <p className="font-medium mb-1">沒在官網清單的怎麼辦？</p>
          <p className="text-ink-soft text-xs leading-relaxed">
            傳商品連結到 LINE，30 分鐘內人工回覆是否可代購。
          </p>
          <span className="inline-block mt-3 text-xs text-ink-soft">
            （Phase 3 開放 LINE Bot 自動報價）
          </span>
        </div>
        <div className="bg-white border border-line rounded-lg p-5">
          <p className="font-medium mb-1">我們不代購什麼？</p>
          <p className="text-ink-soft text-xs leading-relaxed">
            需查驗登記商品（嬰兒奶粉、藥品、含肉寵物食品等）一律不接。
          </p>
          <Link
            href="/about"
            className="inline-block mt-3 text-xs text-accent hover:underline"
          >
            法規誠信宣告 →
          </Link>
        </div>
      </section>
    </div>
  )
}
