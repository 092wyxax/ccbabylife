import Link from 'next/link'
import { SEASONAL_PICKS, type Season } from '@/lib/japan-content'
import { formatJpy } from '@/lib/format'

export const metadata = {
  title: '日本各地季節限定',
  description: '日本各都道府縣四季限定母嬰選物 — 櫻花季、夏祭、紅葉、聖誕。',
}

const SEASON_LABEL: Record<Season, { jp: string; zh: string; emoji: string }> = {
  spring: { jp: '春', zh: '春季', emoji: '🌸' },
  summer: { jp: '夏', zh: '夏季', emoji: '🎐' },
  autumn: { jp: '秋', zh: '秋季', emoji: '🍁' },
  winter: { jp: '冬', zh: '冬季', emoji: '❄' },
}

const ORDER: Season[] = ['spring', 'summer', 'autumn', 'winter']

interface Props {
  searchParams: Promise<{ season?: string }>
}

export default async function SeasonalPage({ searchParams }: Props) {
  const { season: seasonParam } = await searchParams
  const activeSeason = (
    ORDER.includes(seasonParam as Season) ? seasonParam : currentSeason()
  ) as Season

  const items = SEASONAL_PICKS.filter((s) => s.season === activeSeason).sort(
    (a, b) => a.startMonth - b.startMonth
  )

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-3">
        SEASONAL · 季節限定・期間限定
      </p>
      <h1 className="font-serif text-3xl sm:text-4xl mb-3 tracking-wide">
        日本各地季節限定
      </h1>
      <p className="text-ink-soft max-w-2xl leading-relaxed mb-10">
        日本品牌每年依季節、地區發行的限定品。
        櫻花、夏祭、紅葉、聖誕 — 每個季節都有那個季節獨有的選物。
        錯過就要等明年。
      </p>

      <nav className="flex flex-wrap gap-2 mb-10 pb-4 border-b border-line">
        {ORDER.map((s) => {
          const meta = SEASON_LABEL[s]
          const active = s === activeSeason
          return (
            <Link
              key={s}
              href={`/seasonal?season=${s}`}
              className={
                'font-jp text-sm px-4 py-2 rounded-md border transition-colors tracking-wider ' +
                (active
                  ? 'bg-ink text-cream border-ink'
                  : 'border-line text-ink-soft hover:border-ink hover:text-ink')
              }
            >
              {meta.emoji} {meta.jp} · {meta.zh}
            </Link>
          )
        })}
      </nav>

      {items.length === 0 ? (
        <p className="py-16 text-center text-ink-soft border border-dashed border-line rounded-lg">
          這個季節目前沒有資料，朋友還在採集中。
        </p>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-5">
          {items.map((s, i) => (
            <li
              key={`${s.prefecture}-${s.productNameJp}-${i}`}
              className="bg-white border border-line rounded-lg p-6 flex flex-col"
            >
              <header className="flex items-baseline justify-between mb-4">
                <div>
                  <p className="font-jp text-xs tracking-[0.2em] text-accent">
                    {s.prefectureJp} · {s.prefecture}
                  </p>
                  <p className="font-jp text-[10px] tracking-[0.2em] text-ink-soft mt-0.5">
                    {s.startMonth} 月 – {s.endMonth} 月
                  </p>
                </div>
                {s.motif && (
                  <span className="font-jp text-xs text-ink-soft tracking-wider">
                    {s.motif}
                  </span>
                )}
              </header>

              <h3 className="font-serif text-lg mb-1 tracking-wide">
                {s.productNameZh}
              </h3>
              <p className="font-jp text-xs text-ink-soft mb-4">
                {s.productNameJp}
              </p>

              <p className="text-sm leading-relaxed text-ink/90 mb-4 flex-1">
                {s.description}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-line">
                {s.priceJpy ? (
                  <span className="font-mono text-sm">{formatJpy(s.priceJpy)}</span>
                ) : (
                  <span className="text-xs text-ink-soft">店頭限定価格</span>
                )}
                {s.ourProductSlug ? (
                  <Link
                    href={`/shop/${s.ourProductSlug}`}
                    className="font-jp text-xs bg-ink text-cream px-3 py-1.5 rounded-md hover:bg-accent transition-colors tracking-wider"
                  >
                    購入 →
                  </Link>
                ) : (
                  <span className="font-jp text-xs text-ink-soft tracking-wider">
                    予約代購可
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-12 bg-cream-100 border border-line rounded-lg p-6 text-sm leading-relaxed">
        <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">
          ご注意 · 季節限定品的特性
        </p>
        <p className="text-ink-soft">
          日本季節限定品通常**每年數量有限、上市期間極短**（多數 3–8 週）。
          想代購請於該品項上市第 1 週內告知本店，否則經常售完。
          詳細請私訊 LINE 客服。
        </p>
      </section>
    </div>
  )
}

function currentSeason(): Season {
  const m = new Date().getMonth() + 1
  if (m >= 3 && m <= 5) return 'spring'
  if (m >= 6 && m <= 8) return 'summer'
  if (m >= 9 && m <= 11) return 'autumn'
  return 'winter'
}
