import {
  AboutResearchIllustration,
  AboutSourcingIllustration,
  AboutPackingIllustration,
} from '@/components/shared/BrandIllustrations'

const TRUST = [
  {
    Illustration: AboutResearchIllustration,
    tone: 'text-seal',
    title: '親身試用',
    desc: '我家寶寶日常用著的東西',
  },
  {
    Illustration: AboutSourcingIllustration,
    tone: 'text-sage',
    title: '日本實採',
    desc: '實體店面 / 官網下單',
  },
  {
    Illustration: AboutPackingIllustration,
    tone: 'text-accent',
    title: '溫柔包裝',
    desc: '附手寫感謝小卡',
  },
]

/**
 * Compact 3-column trust strip below the add-to-cart on PDP.
 * Reuses the About-page narrative illustrations at smaller size.
 */
export function ProductTrustStrip() {
  return (
    <section className="mt-8 pt-6 border-t border-line">
      <p className="font-jp text-[10px] tracking-[0.3em] text-ink-soft text-center mb-5">
        OUR PROMISE · 私たちの約束
      </p>
      <div className="grid grid-cols-3 gap-3">
        {TRUST.map((t) => (
          <div key={t.title} className="text-center">
            <div className={`flex justify-center mb-2 ${t.tone}`}>
              <t.Illustration className="w-16 h-14" />
            </div>
            <p className="font-medium text-sm">{t.title}</p>
            <p className="text-[11px] text-ink-soft mt-0.5 leading-snug">{t.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
