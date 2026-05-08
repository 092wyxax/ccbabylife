import Link from 'next/link'
import {
  AboutResearchIllustration,
  AboutSourcingIllustration,
  AboutPackingIllustration,
} from '@/components/shared/BrandIllustrations'

export const metadata = {
  title: '關於我們 + 法規誠信宣告',
  description:
    '1 歲娃媽親身試用、嚴選日系好物。我們不販售需查驗登記商品，這是我們選擇難走但合法的路。',
}

const STORY = [
  {
    illustration: <AboutResearchIllustration className="w-32 h-28" />,
    tone: 'text-seal',
    eyebrow: '01 · リサーチ',
    title: '研究選物',
    body: '每週看日本 Amazon JP / 樂天熱銷榜、媽媽 IG 社群、鄰居推薦。挑出真正設計用心、媽媽真會回購的東西。',
  },
  {
    illustration: <AboutSourcingIllustration className="w-32 h-28" />,
    tone: 'text-sage',
    eyebrow: '02 · 仕入れ',
    title: '日本實地採購',
    body: '週日 23:59 截單、週一上午由我們的日本端朋友親自到實體店面 / 官網下單。不是水貨倉、不是黑市。',
  },
  {
    illustration: <AboutPackingIllustration className="w-32 h-28" />,
    tone: 'text-accent',
    eyebrow: '03 · お届け',
    title: '溫柔包裝寄出',
    body: '集運回台灣 → 拆箱檢查 → 重新打包加防撞 → 附上手寫感謝小卡。10–14 天內送到你手上。',
  },
]

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-3">
        ABOUT · 私たちのこと
      </p>
      <h1 className="font-serif text-4xl mb-8 tracking-wide">關於我們</h1>

      <section className="prose prose-stone max-w-none text-ink leading-relaxed space-y-5">
        <p>
          我們是一家三人經營的小選物店：
          <strong>媽媽（內容＋客服）、爸爸（系統＋物流）、朋友（日本實地採購）</strong>。
          每週日截單、週一日本下單，10–14 天到貨。
        </p>
        <p>
          開店的起心動念，是因為自己寶寶用了一堆日本品牌的母嬰用品 ——
          紗布巾、奶瓶、固齒器、推車涼感扇 —— 覺得設計細節真的細緻。
          但在台灣買，不是缺貨就是價差離譜，又或是來路不明。
        </p>
        <p>
          所以我們想做一件事：<strong>把媽媽真心試過的日系好物，誠實帶回台灣</strong>。
          不誇大療效、不主打最便宜、不販售不該賣的東西。
        </p>
      </section>

      <section className="mt-16">
        <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2 text-center">
          OUR FLOW · 仕事の流れ
        </p>
        <h2 className="font-serif text-2xl mb-10 tracking-wide text-center">
          每週的選物節奏
        </h2>
        <div className="space-y-12">
          {STORY.map((s, i) => (
            <div
              key={s.eyebrow}
              className={`flex flex-col sm:flex-row gap-6 items-center ${
                i % 2 === 1 ? 'sm:flex-row-reverse' : ''
              }`}
            >
              <div className={`flex-shrink-0 ${s.tone}`}>{s.illustration}</div>
              <div className="flex-1 text-center sm:text-left">
                <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-1">
                  {s.eyebrow}
                </p>
                <h3 className="font-serif text-xl mb-2 tracking-wide">{s.title}</h3>
                <p className="text-ink-soft text-sm leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 p-8 border-2 border-accent rounded-lg bg-accent/5">
        <p className="font-jp text-xs tracking-[0.3em] text-accent mb-3">
          法令誠信 · COMPLIANCE
        </p>
        <h2 className="font-serif text-2xl mb-5 tracking-wide">不販售需查驗登記商品</h2>

        <div className="space-y-4 text-sm leading-relaxed">
          <p>我們堅持只販售可合法平行輸入的綠燈品項。我們<strong>不代購</strong>以下商品：</p>

          <ul className="list-disc list-inside space-y-1 text-ink-soft">
            <li>嬰兒奶粉、嬰幼兒副食品（食安法、嬰幼兒配方查驗登記）</li>
            <li>處方藥、感冒藥、保健食品、嬰兒退熱貼、體溫計（藥事法、醫療器材法）</li>
            <li>寵物處方食品、寵物用藥（動物用藥品管理法）</li>
            <li>含肉寵物食品（動物傳染病防治條例 — 商業進口需檢疫）</li>
            <li>一般食品、健康食品、含酒精商品</li>
            <li>武器、刀械、仿冒品、未送審成人用品</li>
          </ul>

          <p>
            即使客戶私訊詢問，我們會婉拒並說明原因。
          </p>

          <p>
            這是我們與其他日本代購最大的差異 —— 我們選擇<strong>難走但合法</strong>的路。
            因為我們相信：在母嬰、寵物這類「進到口、貼到身上」的品類，
            誠信是品牌唯一能長久的根基。
          </p>
        </div>
      </section>

      <section className="mt-12 bg-cream-100 border border-line rounded-lg p-6 text-sm leading-relaxed">
        <p className="font-medium mb-2">嚴選，不接客製代購</p>
        <p className="text-ink-soft">
          我們是一家精選 30 件 SKU 起步的小選物店，不接客戶指定代購。
          這讓我們能把時間花在真正試用、寫真實心得、確認法規與品質上。
          想看我們挑了什麼，請逛 <Link href="/shop" className="underline hover:text-accent">/shop</Link>。
        </p>
      </section>

      <section className="mt-12 text-sm text-ink-soft">
        <p className="font-jp mb-2 tracking-[0.2em] text-ink/70">営業案內 · INFO</p>
        <dl className="space-y-1">
          <div className="flex gap-3"><dt className="font-jp shrink-0 w-20 text-ink/70">統一編號</dt><dd>60766849</dd></div>
          <div className="flex gap-3"><dt className="font-jp shrink-0 w-20 text-ink/70">店主</dt><dd>先生（Tech Lead） / 太太（Brand & CS） / 朋友（JP Sourcing）</dd></div>
          <div className="flex gap-3"><dt className="font-jp shrink-0 w-20 text-ink/70">営業時間</dt><dd>週一〜五 09:00–18:00（LINE 客服）</dd></div>
          <div className="flex gap-3"><dt className="font-jp shrink-0 w-20 text-ink/70">締切</dt><dd>毎週日 23:59（隔週一日本下單）</dd></div>
        </dl>
      </section>
    </div>
  )
}
