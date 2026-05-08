import Link from 'next/link'
import {
  CATEGORY_ILLUSTRATIONS,
  type IllustratedCategorySlug,
} from './CategoryIllustrations'

interface CategoryEntry {
  slug: IllustratedCategorySlug
  label: string
  jp: string
  desc: string
  /** Tailwind text color class for the illustration accent */
  tone: string
  /** bg tint for the card */
  bg: string
}

const ENTRIES: CategoryEntry[] = [
  {
    slug: 'baby-essentials',
    label: '母嬰用品',
    jp: 'ベビー用品',
    desc: '奶瓶、奶嘴、紗布巾',
    tone: 'text-seal',
    bg: 'bg-blush-soft/40',
  },
  {
    slug: 'baby-apparel',
    label: '母嬰服飾',
    jp: 'ベビー服',
    desc: '連身衣、襪子、圍兜',
    tone: 'text-sage',
    bg: 'bg-sage-soft/50',
  },
  {
    slug: 'baby-living',
    label: '母嬰生活',
    jp: 'ベビーグッズ',
    desc: '學習杯、餐具、餐椅',
    tone: 'text-accent',
    bg: 'bg-accent-soft/30',
  },
  {
    slug: 'pet-supplies',
    label: '寵物用品',
    jp: 'ペット用品',
    desc: '玩具、零食、清潔用品',
    tone: 'text-ink',
    bg: 'bg-beige-soft/60',
  },
]

interface Props {
  /** Optional title; pass null to render no header */
  title?: string | null
}

/**
 * Hand-drawn-illustrated category cards. Drop on home, /shop, or any
 * landing page that needs a "browse by category" moment.
 */
export function CategoryShowcase({ title = '商品分類' }: Props) {
  return (
    <section className="my-16">
      {title !== null && (
        <header className="text-center mb-10">
          <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">
            BROWSE · お買い物カテゴリ
          </p>
          <h2 className="font-serif text-2xl tracking-wide">{title}</h2>
        </header>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {ENTRIES.map((c) => {
          const Illustration = CATEGORY_ILLUSTRATIONS[c.slug]
          return (
            <Link
              key={c.slug}
              href={`/shop?category=${c.slug}`}
              className={
                'group relative overflow-hidden rounded-xl px-5 py-7 sm:py-9 ' +
                'transition-all hover:-translate-y-0.5 hover:shadow-sm ' +
                c.bg
              }
            >
              <div
                className={
                  'flex justify-center mb-4 ' + c.tone
                }
              >
                <Illustration className="w-16 h-16 sm:w-20 sm:h-20 transition-transform group-hover:rotate-[-2deg]" />
              </div>
              <p className="font-jp text-[10px] tracking-[0.25em] text-ink-soft text-center mb-1">
                {c.jp}
              </p>
              <h3 className="text-center font-serif text-base sm:text-lg tracking-wide">
                {c.label}
              </h3>
              <p className="text-center text-xs text-ink-soft mt-1.5 leading-relaxed">
                {c.desc}
              </p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
