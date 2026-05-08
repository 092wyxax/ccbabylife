/**
 * Hand-drawn line-art illustrations for the 4 main product categories.
 * Pure SVG, no deps. ~80×80 viewBox. Use color via Tailwind text-* on parent.
 *
 * Style guide:
 *  - stroke 1.5, round caps + round joins
 *  - light wobble via Bezier handles for hand-drawn feel
 *  - never fully closed shapes — leave a small gap so it reads "sketched"
 *  - one accent color block in each (uses CSS var so we can theme per-category)
 */

interface IllustrationProps {
  className?: string
  /** CSS color for the soft fill block. Defaults to currentColor at 15% */
  fill?: string
}

function commonProps(className?: string) {
  return {
    viewBox: '0 0 80 80',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className: className ?? 'w-16 h-16',
    'aria-hidden': true as const,
  }
}

const STROKE = {
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/** 母嬰用品 — 奶瓶 + 安撫奶嘴 */
export function BabyEssentialsIllustration({ className, fill }: IllustrationProps) {
  return (
    <svg {...commonProps(className)}>
      {/* Soft fill blob behind */}
      <ellipse cx="32" cy="46" rx="11" ry="13" fill={fill ?? 'currentColor'} fillOpacity="0.08" />

      {/* Bottle body */}
      <g {...STROKE}>
        {/* nipple top */}
        <path d="M28 12 Q32 8, 36 12" />
        <path d="M28 12 Q26 16, 28 19" />
        <path d="M36 12 Q38 16, 36 19" />
        {/* collar */}
        <path d="M27 19 L37 19" />
        <path d="M26 22 L38 22" />
        {/* body */}
        <path d="M26 22 Q24 27, 24 35 L24 52 Q24 60, 32 60 Q40 60, 40 52 L40 35 Q40 27, 38 22" />
        {/* measure marks */}
        <path d="M28 36 L31 36" strokeWidth="1" opacity="0.6" />
        <path d="M28 42 L31 42" strokeWidth="1" opacity="0.6" />
        <path d="M28 48 L31 48" strokeWidth="1" opacity="0.6" />
      </g>

      {/* Pacifier off to the side */}
      <g {...STROKE}>
        <circle cx="58" cy="38" r="6" />
        <path d="M52 38 Q48 38, 48 33 Q48 28, 52 28 Q56 28, 56 33" />
        {/* ring */}
        <circle cx="62" cy="42" r="3" opacity="0.7" />
      </g>
    </svg>
  )
}

/** 母嬰服飾 — 嬰兒服 + 小襪子 */
export function BabyApparelIllustration({ className, fill }: IllustrationProps) {
  return (
    <svg {...commonProps(className)}>
      <ellipse cx="30" cy="44" rx="18" ry="14" fill={fill ?? 'currentColor'} fillOpacity="0.08" />

      {/* Onesie */}
      <g {...STROKE}>
        {/* shoulders + sleeves */}
        <path d="M18 24 L26 18 L34 22 L42 18 L50 24" />
        <path d="M18 24 L14 30 L16 36 L20 32" />
        <path d="M50 24 L54 30 L52 36 L48 32" />
        {/* body */}
        <path d="M20 32 L20 56 Q20 60, 26 60 L42 60 Q48 60, 48 56 L48 32" />
        {/* leg gap */}
        <path d="M34 60 L34 50 Q34 46, 30 46" opacity="0.6" />
        <path d="M34 60 L34 50 Q34 46, 38 46" opacity="0.6" />
        {/* button */}
        <circle cx="34" cy="40" r="1.5" />
      </g>

      {/* Sock */}
      <g {...STROKE}>
        <path d="M58 40 L58 48 Q58 54, 64 54 L70 54 Q72 54, 72 52 L72 50 Q72 48, 70 48 L66 48 Q64 48, 64 46 L64 40" />
        {/* cuff */}
        <path d="M58 40 L64 40" />
        <path d="M58 43 L64 43" opacity="0.5" />
      </g>
    </svg>
  )
}

/** 母嬰生活 — 學習杯 + 碗 */
export function BabyLivingIllustration({ className, fill }: IllustrationProps) {
  return (
    <svg {...commonProps(className)}>
      <ellipse cx="40" cy="50" rx="20" ry="12" fill={fill ?? 'currentColor'} fillOpacity="0.08" />

      {/* Sippy cup with handle */}
      <g {...STROKE}>
        {/* spout */}
        <path d="M22 18 Q20 18, 19 20 L18 24 L24 24 L23 20 Q22 18, 22 18 Z" />
        {/* lid */}
        <path d="M14 24 L30 24" />
        <path d="M14 24 L13 28 L31 28 L30 24" />
        {/* body */}
        <path d="M14 28 L15 50 Q15 56, 22 56 Q29 56, 29 50 L30 28" />
        {/* handle */}
        <path d="M30 32 Q38 32, 38 40 Q38 48, 30 48" />
      </g>

      {/* Bowl with spoon */}
      <g {...STROKE}>
        {/* bowl */}
        <path d="M44 42 Q44 56, 58 56 Q72 56, 72 42 Z" />
        <path d="M44 42 L72 42" />
        {/* contents waves */}
        <path d="M50 47 Q54 45, 58 47 Q62 49, 66 47" opacity="0.6" />
        {/* spoon */}
        <ellipse cx="68" cy="32" rx="3" ry="5" transform="rotate(25 68 32)" />
        <path d="M70 36 L75 46" />
      </g>
    </svg>
  )
}

/** 寵物用品 — 骨頭 + 魚 */
export function PetSuppliesIllustration({ className, fill }: IllustrationProps) {
  return (
    <svg {...commonProps(className)}>
      <ellipse cx="40" cy="46" rx="22" ry="14" fill={fill ?? 'currentColor'} fillOpacity="0.08" />

      {/* Bone */}
      <g {...STROKE} transform="rotate(-15 28 30)">
        <path d="M14 26 Q10 26, 10 30 Q10 34, 14 34 Q14 36, 18 36 Q22 36, 22 32 L34 32 Q34 36, 38 36 Q42 36, 42 34 Q46 34, 46 30 Q46 26, 42 26 Q42 24, 38 24 Q34 24, 34 28 L22 28 Q22 24, 18 24 Q14 24, 14 26 Z" />
      </g>

      {/* Fish */}
      <g {...STROKE} transform="translate(40 50)">
        {/* body */}
        <path d="M0 0 Q8 -8, 20 0 Q8 8, 0 0 Z" />
        {/* tail */}
        <path d="M20 0 L28 -5 L26 0 L28 5 L20 0 Z" />
        {/* eye */}
        <circle cx="6" cy="-1" r="0.8" fill="currentColor" />
        {/* gill */}
        <path d="M10 -3 Q10 0, 10 3" opacity="0.5" />
      </g>

      {/* Paw print accent */}
      <g {...STROKE} opacity="0.7">
        <ellipse cx="60" cy="22" rx="2" ry="2.5" />
        <ellipse cx="65" cy="20" rx="2" ry="2.5" />
        <ellipse cx="70" cy="22" rx="2" ry="2.5" />
        <ellipse cx="65" cy="28" rx="3.5" ry="3" />
      </g>
    </svg>
  )
}

/* ── Map slug → component for use on listings ── */
export const CATEGORY_ILLUSTRATIONS = {
  'baby-essentials': BabyEssentialsIllustration,
  'baby-apparel': BabyApparelIllustration,
  'baby-living': BabyLivingIllustration,
  'pet-supplies': PetSuppliesIllustration,
} as const

export type IllustratedCategorySlug = keyof typeof CATEGORY_ILLUSTRATIONS
