import { CalculatorForm } from './CalculatorForm'

export const metadata = {
  title: '透明定價試算',
  description: '輸入日幣售價、重量、品類，即時看到我們的成本、運費、服務費、毛利。',
}

export default function CalculatorPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
      <header className="text-center mb-10">
        <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">
          PRICING · 価格の見える化
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl tracking-wide mb-3">
          透明定價試算
        </h1>
        <p className="text-ink-soft text-sm sm:text-base leading-relaxed max-w-md mx-auto">
          我們不收會員費、不抽傭金、不加無名雜費。
          <br />
          每件商品的價格都按公式計算，你可以親自試算看看。
        </p>
      </header>

      <CalculatorForm />

      <section className="mt-12 bg-cream-100 border border-line rounded-lg p-6 text-sm">
        <h2 className="font-serif text-lg mb-3">公式說明</h2>
        <dl className="space-y-3 text-ink/90 leading-relaxed">
          <div>
            <dt className="font-medium">日幣 → 台幣</dt>
            <dd className="text-ink-soft mt-0.5">
              使用台銀現金賣出價 × 1.02（緩衝匯率）。即時匯率每日凌晨更新。
            </dd>
          </div>
          <div>
            <dt className="font-medium">國際運費</dt>
            <dd className="text-ink-soft mt-0.5">
              依重量級距：&lt;500g NT$80 / &lt;1kg NT$130 / &lt;3kg NT$250 / &lt;5kg NT$400。
              海運基準，空運加成 2 倍。
            </dd>
          </div>
          <div>
            <dt className="font-medium">服務費</dt>
            <dd className="text-ink-soft mt-0.5">
              ¥&lt;1500 NT$50 / ¥&lt;5000 NT$80 / ¥&lt;15000 NT$150 / ¥≥15000 NT$250。
            </dd>
          </div>
          <div>
            <dt className="font-medium">毛利率</dt>
            <dd className="text-ink-soft mt-0.5">
              母嬰服飾 30%、母嬰用品 35%、寵物食品 25%、寵物用品 30%、限定品 / 排隊品 45%。
            </dd>
          </div>
          <div>
            <dt className="font-medium">最低毛利</dt>
            <dd className="text-ink-soft mt-0.5">
              小額訂單若毛利 &lt; NT$80，會補到 NT$80（避免賠錢做工）。
            </dd>
          </div>
          <div>
            <dt className="font-medium">尾數捨入</dt>
            <dd className="text-ink-soft mt-0.5">
              &lt;NT$1,000 進位到 10 元 / &lt;NT$5,000 進位到 50 元 / 其餘進位到 100 元。
            </dd>
          </div>
        </dl>
      </section>

      <p className="text-xs text-ink-soft text-center mt-8 leading-relaxed">
        💡 我們相信定價誠信是品牌的根基。任何問題都歡迎透過 LINE 客服詢問。
      </p>
    </div>
  )
}
