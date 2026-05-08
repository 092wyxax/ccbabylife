/**
 * Brand-wide illustrations sharing the line-art style of CategoryIllustrations.
 * Used in emotional moments: order success, empty states, 404, onboarding,
 * order-tracking micro-states, etc.
 *
 * Style guide:
 *  - stroke 1.5, round caps + round joins
 *  - one soft fill blob behind for warmth
 *  - never fully closed shapes — leave a small gap so it reads "sketched"
 *  - one accent block per illustration
 */

interface Props {
  className?: string
  fill?: string
}

const STROKE = {
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function svgProps(className?: string) {
  return {
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className: className ?? 'w-32 h-32',
    'aria-hidden': true as const,
  }
}

/* ──────────────────────────────────────────────────────────
   1. ORDER SUCCESS — celebratory ribbon-tied gift box +
      paper crane + sparkles
   ────────────────────────────────────────────────────────── */
export function OrderSuccessIllustration({ className, fill }: Props) {
  return (
    <svg viewBox="0 0 200 160" {...svgProps(className)}>
      {/* Soft blush blob */}
      <ellipse cx="100" cy="100" rx="70" ry="40" fill={fill ?? '#e7c4c0'} fillOpacity="0.18" />

      {/* Gift box */}
      <g {...STROKE}>
        {/* lid lifted slightly off */}
        <path d="M55 78 Q55 74, 60 74 L140 74 Q145 74, 145 78 L145 86 L55 86 Z" />
        <path d="M55 86 L55 130 Q55 134, 60 134 L140 134 Q145 134, 145 130 L145 86" />
        {/* ribbon vertical */}
        <path d="M100 74 L100 134" />
        {/* ribbon horizontal */}
        <path d="M55 105 L145 105" />
        {/* bow */}
        <path d="M100 74 Q88 64, 92 70 Q96 76, 100 74" />
        <path d="M100 74 Q112 64, 108 70 Q104 76, 100 74" />
        <path d="M100 70 L100 76" />
        {/* lid is a bit tilted */}
        <path d="M55 86 L52 80 L148 80 L145 86" opacity="0.7" />
      </g>

      {/* Paper crane flying out of box */}
      <g {...STROKE} transform="translate(100 50) rotate(-15)">
        <path d="M0 0 L18 -6 L8 6 Z" />
        <path d="M0 0 L-12 4 L-6 -8 Z" />
        <path d="M8 6 L14 14" />
        <circle cx="-2" cy="-1" r="0.6" fill="currentColor" />
      </g>

      {/* Sparkles */}
      <g {...STROKE} opacity="0.7">
        <path d="M40 50 L40 56 M37 53 L43 53" />
        <path d="M160 60 L160 64 M158 62 L162 62" />
        <path d="M170 95 L170 100 M167 97.5 L173 97.5" />
        <path d="M30 100 L30 105 M27 102.5 L33 102.5" />
      </g>

      {/* Confetti dots */}
      <g fill="currentColor" opacity="0.5">
        <circle cx="50" cy="40" r="1.5" />
        <circle cx="155" cy="45" r="1.5" />
        <circle cx="180" cy="80" r="1.5" />
        <circle cx="25" cy="80" r="1.5" />
        <circle cx="170" cy="120" r="1.5" />
      </g>
    </svg>
  )
}

/* ──────────────────────────────────────────────────────────
   2a. EMPTY CART — empty wicker basket + falling sakura
   ────────────────────────────────────────────────────────── */
export function EmptyCartIllustration({ className, fill }: Props) {
  return (
    <svg viewBox="0 0 160 140" {...svgProps(className ?? 'w-40 h-32')}>
      <ellipse cx="80" cy="115" rx="55" ry="8" fill={fill ?? '#e8d9b9'} fillOpacity="0.4" />

      {/* Basket */}
      <g {...STROKE}>
        {/* handle */}
        <path d="M50 50 Q80 25, 110 50" />
        <path d="M55 50 Q80 30, 105 50" opacity="0.5" />
        {/* rim */}
        <path d="M40 60 L120 60" />
        {/* body */}
        <path d="M44 60 L52 105 Q52 110, 58 110 L102 110 Q108 110, 108 105 L116 60" />
        {/* weave lines */}
        <path d="M48 75 L112 75" opacity="0.4" />
        <path d="M50 90 L110 90" opacity="0.4" />
        {/* vertical weave */}
        <path d="M65 62 L67 105" opacity="0.3" />
        <path d="M80 62 L80 110" opacity="0.3" />
        <path d="M95 62 L93 105" opacity="0.3" />
      </g>

      {/* Falling sakura petals */}
      <g {...STROKE} fill={fill ?? '#e7c4c0'} fillOpacity="0.6">
        <path d="M28 20 Q26 22, 28 26 Q32 24, 30 20 Q29 18, 28 20 Z" transform="rotate(20 28 23)" />
        <path d="M130 30 Q128 32, 130 36 Q134 34, 132 30 Q131 28, 130 30 Z" transform="rotate(-30 130 33)" />
        <path d="M135 75 Q133 77, 135 81 Q139 79, 137 75 Q136 73, 135 75 Z" transform="rotate(60 135 78)" />
        <path d="M22 70 Q20 72, 22 76 Q26 74, 24 70 Q23 68, 22 70 Z" transform="rotate(-20 22 73)" />
      </g>
    </svg>
  )
}

/* ──────────────────────────────────────────────────────────
   2b. EMPTY WISHLIST — pin board with one missing pin
   ────────────────────────────────────────────────────────── */
export function EmptyWishlistIllustration({ className, fill }: Props) {
  return (
    <svg viewBox="0 0 160 140" {...svgProps(className ?? 'w-40 h-32')}>
      <rect x="20" y="20" width="120" height="100" rx="3" fill={fill ?? '#e8d9b9'} fillOpacity="0.18" />

      <g {...STROKE}>
        {/* board frame */}
        <rect x="20" y="20" width="120" height="100" rx="3" />
        {/* pinned note 1 */}
        <rect x="35" y="35" width="32" height="40" rx="1" />
        <circle cx="51" cy="38" r="2" fill="currentColor" />
        {/* pinned note 2 (heart drawn) */}
        <rect x="78" y="50" width="32" height="40" rx="1" />
        <path d="M88 65 Q86 62, 88 60 Q90 58, 92 60 Q94 58, 96 60 Q98 62, 96 65 L92 70 Z" fill={fill ?? '#e7c4c0'} fillOpacity="0.5" />
        <circle cx="94" cy="53" r="2" fill="currentColor" />
        {/* empty pinned outline (dashed) — represents wishlist absence */}
        <rect x="115" y="40" width="20" height="28" rx="1" strokeDasharray="3 3" opacity="0.5" />

        {/* loose pin off to the side */}
        <g transform="translate(120 100)">
          <circle cx="0" cy="0" r="3" />
          <path d="M0 3 L0 8" />
        </g>
      </g>
    </svg>
  )
}

/* ──────────────────────────────────────────────────────────
   2c. EMPTY ORDERS — stack of paper + envelope
   ────────────────────────────────────────────────────────── */
export function EmptyOrdersIllustration({ className, fill }: Props) {
  return (
    <svg viewBox="0 0 160 140" {...svgProps(className ?? 'w-40 h-32')}>
      <ellipse cx="80" cy="115" rx="50" ry="6" fill={fill ?? '#9ca893'} fillOpacity="0.18" />

      <g {...STROKE}>
        {/* stack of receipts */}
        <rect x="35" y="55" width="60" height="52" rx="1" transform="rotate(-3 65 81)" />
        <rect x="42" y="50" width="60" height="55" rx="1" transform="rotate(2 72 77)" />
        {/* lines on receipt */}
        <path d="M50 64 L92 64" opacity="0.4" transform="rotate(2 72 77)" />
        <path d="M50 72 L82 72" opacity="0.4" transform="rotate(2 72 77)" />
        <path d="M50 80 L92 80" opacity="0.4" transform="rotate(2 72 77)" />
        <path d="M50 88 L72 88" opacity="0.4" transform="rotate(2 72 77)" />

        {/* envelope behind */}
        <g transform="translate(85 35)">
          <rect x="0" y="0" width="40" height="28" rx="1" />
          <path d="M0 0 L20 16 L40 0" />
        </g>
      </g>
    </svg>
  )
}

/* ──────────────────────────────────────────────────────────
   3. 404 — lost compass + map
   ────────────────────────────────────────────────────────── */
export function NotFoundIllustration({ className, fill }: Props) {
  return (
    <svg viewBox="0 0 200 160" {...svgProps(className)}>
      <ellipse cx="100" cy="125" rx="70" ry="10" fill={fill ?? '#e8d9b9'} fillOpacity="0.3" />

      <g {...STROKE}>
        {/* Compass body */}
        <circle cx="100" cy="80" r="40" />
        <circle cx="100" cy="80" r="34" opacity="0.4" />
        {/* Cardinal marks */}
        <path d="M100 46 L100 50" />
        <path d="M100 110 L100 114" />
        <path d="M66 80 L70 80" />
        <path d="M130 80 L134 80" />
        {/* Needle pointing odd direction (lost) */}
        <path d="M100 80 L88 65" />
        <path d="M100 80 L106 96" opacity="0.6" />
        {/* center pivot */}
        <circle cx="100" cy="80" r="2.5" fill="currentColor" />
        {/* N marker */}
      </g>
      <text x="100" y="44" textAnchor="middle" fontSize="10" fontFamily="serif" fill="currentColor" opacity="0.6">N</text>

      {/* Question marks floating */}
      <g {...STROKE} opacity="0.7">
        <text x="35" y="55" fontSize="20" fontFamily="serif" fill="currentColor" opacity="0.5">?</text>
        <text x="155" y="65" fontSize="14" fontFamily="serif" fill="currentColor" opacity="0.5">?</text>
        <text x="160" y="105" fontSize="18" fontFamily="serif" fill="currentColor" opacity="0.5">?</text>
      </g>

      {/* Sparkles */}
      <g {...STROKE} opacity="0.6">
        <path d="M40 100 L40 105 M37 102.5 L43 102.5" />
        <path d="M170 50 L170 55 M167 52.5 L173 52.5" />
      </g>
    </svg>
  )
}

/* ──────────────────────────────────────────────────────────
   4a. ONBOARDING — Japanese shop with curtain (noren)
   ────────────────────────────────────────────────────────── */
export function ShopFrontIllustration({ className, fill }: Props) {
  return (
    <svg viewBox="0 0 200 160" {...svgProps(className)}>
      <rect x="30" y="50" width="140" height="80" fill={fill ?? '#f5f1ea'} fillOpacity="0.6" />

      <g {...STROKE}>
        {/* Roof */}
        <path d="M20 60 L100 30 L180 60 L170 60 L170 50 L30 50 L30 60 Z" />
        <path d="M30 50 L170 50" />
        {/* Pillars */}
        <path d="M40 60 L40 130" />
        <path d="M160 60 L160 130" />
        {/* Floor */}
        <path d="M30 130 L170 130" />
        {/* Noren (curtain) */}
        <path d="M50 65 L150 65" />
        <path d="M50 65 L52 90" />
        <path d="M75 65 L75 88" />
        <path d="M100 65 L100 90" />
        <path d="M125 65 L125 88" />
        <path d="M150 65 L148 90" />
        {/* Kanji on noren — stylized 初 */}
        <text x="100" y="80" textAnchor="middle" fontSize="12" fontFamily="serif" fill="currentColor">初</text>
        {/* Lantern hanging */}
        <ellipse cx="160" cy="40" rx="6" ry="8" />
        <path d="M154 40 L166 40" opacity="0.5" />
        <path d="M160 32 L160 25" />
        <path d="M160 48 L160 52" />
      </g>

      {/* Steam from inside (hint of warmth) */}
      <g {...STROKE} opacity="0.4">
        <path d="M70 110 Q72 105, 70 100" />
        <path d="M85 115 Q83 108, 85 102" />
      </g>
    </svg>
  )
}

/* ──────────────────────────────────────────────────────────
   4b. ONBOARDING — package + plane (international shipping)
   ────────────────────────────────────────────────────────── */
export function ShippingIllustration({ className, fill }: Props) {
  return (
    <svg viewBox="0 0 200 160" {...svgProps(className)}>
      <ellipse cx="100" cy="125" rx="60" ry="8" fill={fill ?? '#9ca893'} fillOpacity="0.25" />

      <g {...STROKE}>
        {/* Package */}
        <rect x="60" y="70" width="80" height="55" rx="2" />
        <path d="M60 88 L140 88" />
        <path d="M100 70 L100 125" />
        {/* Tape */}
        <path d="M95 70 L95 88" opacity="0.4" />
        <path d="M105 70 L105 88" opacity="0.4" />
        {/* Address label */}
        <rect x="73" y="98" width="30" height="18" />
        <path d="M76 105 L98 105" opacity="0.5" />
        <path d="M76 110 L92 110" opacity="0.5" />
      </g>

      {/* Plane flying overhead with dashed trail */}
      <g {...STROKE}>
        <path d="M30 30 Q60 28, 90 30 Q120 32, 150 32" strokeDasharray="2 4" opacity="0.4" />
        <g transform="translate(155 32) rotate(15)">
          <path d="M0 0 L20 -3 L18 3 L0 0 Z" />
          <path d="M5 -1 L0 -7" />
          <path d="M5 1 L0 7" />
        </g>
      </g>

      {/* Stars / cloud puffs */}
      <g {...STROKE} opacity="0.5">
        <path d="M35 60 Q35 56, 40 56 Q45 56, 45 60 Q50 60, 50 64 Q50 68, 45 68 L40 68 Q35 68, 35 64 Z" />
      </g>
    </svg>
  )
}

/* ──────────────────────────────────────────────────────────
   4c. ONBOARDING — mama with baby (real-use stories)
   ────────────────────────────────────────────────────────── */
export function MotherBabyIllustration({ className, fill }: Props) {
  return (
    <svg viewBox="0 0 200 160" {...svgProps(className)}>
      <ellipse cx="100" cy="135" rx="55" ry="8" fill={fill ?? '#e7c4c0'} fillOpacity="0.3" />

      <g {...STROKE}>
        {/* Mother — head + hair bun */}
        <circle cx="80" cy="50" r="14" />
        <path d="M70 42 Q72 36, 80 36 Q88 36, 90 42" />
        <circle cx="76" cy="34" r="3" />
        {/* Mom body */}
        <path d="M65 62 Q60 75, 60 90 L60 130" />
        <path d="M95 62 Q100 75, 100 90 L100 130" />
        <path d="M60 130 L100 130" />
        {/* Arms holding baby */}
        <path d="M65 75 Q90 78, 110 90" />
        <path d="M95 75 Q105 80, 115 95" />

        {/* Baby — head */}
        <circle cx="120" cy="92" r="11" />
        <circle cx="116" cy="89" r="0.8" fill="currentColor" />
        <circle cx="124" cy="89" r="0.8" fill="currentColor" />
        <path d="M118 95 Q120 96, 122 95" />
        {/* Baby blanket */}
        <path d="M110 102 Q115 110, 130 105 Q140 100, 132 92" />
      </g>

      {/* Heart floating */}
      <g {...STROKE} fill={fill ?? '#e7c4c0'} fillOpacity="0.4">
        <path d="M150 50 Q146 46, 150 42 Q154 38, 158 42 Q162 38, 166 42 Q170 46, 166 50 L158 58 Z" />
      </g>
    </svg>
  )
}

/* ──────────────────────────────────────────────────────────
   5. NEWSLETTER — opening gift box revealing voucher
   ────────────────────────────────────────────────────────── */
export function NewsletterGiftIllustration({ className, fill }: Props) {
  return (
    <svg viewBox="0 0 200 160" {...svgProps(className)}>
      <ellipse cx="100" cy="125" rx="65" ry="10" fill={fill ?? '#e7c4c0'} fillOpacity="0.3" />

      <g {...STROKE}>
        {/* Box bottom */}
        <path d="M50 90 L150 90 L150 130 Q150 134, 146 134 L54 134 Q50 134, 50 130 Z" />
        {/* Box ribbon vertical */}
        <path d="M100 90 L100 134" />
        {/* Lid floating up at angle */}
        <g transform="translate(50 60) rotate(-12)">
          <path d="M0 20 L100 20 L100 32 L0 32 Z" />
          <path d="M50 20 L50 32" />
          <path d="M50 20 Q40 12, 44 18 Q48 24, 50 22" />
          <path d="M50 20 Q60 12, 56 18 Q52 24, 50 22" />
        </g>

        {/* Voucher coming out */}
        <g transform="translate(75 65)">
          <rect x="0" y="0" width="50" height="22" rx="2" />
          <path d="M5 11 L45 11" strokeDasharray="2 2" opacity="0.5" />
          <text x="25" y="9" textAnchor="middle" fontSize="6" fontFamily="serif" fill="currentColor" opacity="0.7">CLOUPON</text>
          <text x="25" y="19" textAnchor="middle" fontSize="7" fontFamily="serif" fill="currentColor">NT$100</text>
        </g>
      </g>

      {/* Sparkles */}
      <g {...STROKE} opacity="0.7">
        <path d="M30 40 L30 47 M27 43.5 L33 43.5" />
        <path d="M170 40 L170 47 M167 43.5 L173 43.5" />
        <path d="M40 90 L40 95 M37 92.5 L43 92.5" />
        <path d="M165 100 L165 105 M162 102.5 L168 102.5" />
      </g>
      <g fill="currentColor" opacity="0.5">
        <circle cx="50" cy="50" r="1.5" />
        <circle cx="160" cy="55" r="1.5" />
        <circle cx="170" cy="80" r="1.5" />
      </g>
    </svg>
  )
}

/* ──────────────────────────────────────────────────────────
   6. ORDER TRACKING — 6 micro icons, 32×32 each
   ────────────────────────────────────────────────────────── */
function microSvg(className?: string) {
  return {
    viewBox: '0 0 32 32',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className: className ?? 'w-6 h-6',
    'aria-hidden': true as const,
  }
}

export function MicroPendingPaymentIllustration({ className }: Props) {
  return (
    <svg {...microSvg(className)}>
      <g {...STROKE}>
        <rect x="6" y="9" width="20" height="14" rx="2" />
        <path d="M6 14 L26 14" />
        <circle cx="12" cy="19" r="1.5" fill="currentColor" />
      </g>
    </svg>
  )
}

export function MicroPaidIllustration({ className }: Props) {
  return (
    <svg {...microSvg(className)}>
      <g {...STROKE}>
        <circle cx="16" cy="16" r="10" />
        <path d="M11 16 L15 20 L22 12" />
      </g>
    </svg>
  )
}

export function MicroSourcingIllustration({ className }: Props) {
  return (
    <svg {...microSvg(className)}>
      <g {...STROKE}>
        {/* Japanese gate (torii) */}
        <path d="M5 8 L27 8" />
        <path d="M5 11 L27 11" />
        <path d="M9 11 L9 24" />
        <path d="M23 11 L23 24" />
        <path d="M9 16 L23 16" />
      </g>
    </svg>
  )
}

export function MicroReceivedIllustration({ className }: Props) {
  return (
    <svg {...microSvg(className)}>
      <g {...STROKE}>
        {/* package received in JP */}
        <rect x="6" y="10" width="20" height="14" rx="1" />
        <path d="M6 15 L26 15" />
        <path d="M16 10 L16 24" />
        <path d="M11 7 L21 7" opacity="0.6" />
      </g>
    </svg>
  )
}

export function MicroShippedIllustration({ className }: Props) {
  return (
    <svg {...microSvg(className)}>
      <g {...STROKE}>
        {/* truck */}
        <path d="M3 19 L18 19 L18 11 L3 11 Z" />
        <path d="M18 14 L24 14 L27 17 L27 19 L18 19" />
        <circle cx="8" cy="22" r="2" />
        <circle cx="22" cy="22" r="2" />
      </g>
    </svg>
  )
}

export function MicroCompletedIllustration({ className }: Props) {
  return (
    <svg {...microSvg(className)}>
      <g {...STROKE}>
        {/* heart */}
        <path d="M16 25 L7 16 Q4 13, 7 10 Q10 7, 13 10 L16 13 L19 10 Q22 7, 25 10 Q28 13, 25 16 Z" />
      </g>
    </svg>
  )
}

/* ──────────────────────────────────────────────────────────
   7. ABOUT NARRATIVE — 3 vignettes
   ────────────────────────────────────────────────────────── */
export function AboutResearchIllustration({ className, fill }: Props) {
  return (
    <svg viewBox="0 0 160 140" {...svgProps(className ?? 'w-32 h-28')}>
      <ellipse cx="80" cy="115" rx="55" ry="6" fill={fill ?? '#e8d9b9'} fillOpacity="0.3" />

      <g {...STROKE}>
        {/* Laptop */}
        <path d="M40 70 L120 70 L115 100 L45 100 Z" />
        <path d="M30 100 L130 100" />
        <path d="M30 100 L40 105 L120 105 L130 100" />
        <path d="M65 102 L95 102" opacity="0.5" />
        {/* Coffee mug */}
        <g transform="translate(125 80)">
          <path d="M0 0 L0 12 Q0 16, 4 16 L12 16 Q16 16, 16 12 L16 0 Z" />
          <path d="M16 4 Q22 4, 22 8 Q22 12, 16 12" />
          <path d="M2 -3 Q3 -6, 5 -3" opacity="0.5" />
          <path d="M8 -4 Q9 -7, 11 -4" opacity="0.5" />
        </g>
        {/* Open notebook */}
        <g transform="translate(20 95) rotate(-8)">
          <rect x="0" y="0" width="20" height="14" rx="1" />
          <path d="M3 4 L17 4" opacity="0.4" />
          <path d="M3 8 L13 8" opacity="0.4" />
        </g>
      </g>
    </svg>
  )
}

export function AboutSourcingIllustration({ className, fill }: Props) {
  return (
    <svg viewBox="0 0 160 140" {...svgProps(className ?? 'w-32 h-28')}>
      <ellipse cx="80" cy="120" rx="55" ry="6" fill={fill ?? '#9ca893'} fillOpacity="0.25" />

      <g {...STROKE}>
        {/* Storefront */}
        <path d="M30 60 L80 35 L130 60 L130 110 L30 110 Z" />
        <path d="M30 60 L130 60" />
        <path d="M45 70 L115 70" opacity="0.4" />
        {/* door */}
        <path d="M70 110 L70 80 L90 80 L90 110" />
        <circle cx="86" cy="95" r="1" fill="currentColor" />
        {/* lantern */}
        <ellipse cx="50" cy="50" rx="4" ry="6" />
        <ellipse cx="110" cy="50" rx="4" ry="6" />
        {/* Shopping bag person */}
        <g transform="translate(135 80)">
          <circle cx="0" cy="0" r="4" />
          <path d="M-3 4 L-3 14" />
          <path d="M3 4 L3 14" />
          <path d="M-3 8 L-8 8" />
          <path d="M-8 8 L-8 16" />
          <path d="M-12 16 L-4 16 L-4 22 L-12 22 Z" />
        </g>
      </g>
    </svg>
  )
}

/* ──────────────────────────────────────────────────────────
   FAQ section icons (48×48)
   ────────────────────────────────────────────────────────── */
function faqSvg(className?: string) {
  return {
    viewBox: '0 0 48 48',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className: className ?? 'w-10 h-10',
    'aria-hidden': true as const,
  }
}

export function FaqPreorderIllustration({ className, fill }: Props) {
  return (
    <svg {...faqSvg(className)}>
      <circle cx="24" cy="24" r="18" fill={fill ?? '#e8d9b9'} fillOpacity="0.4" />
      <g {...STROKE}>
        <rect x="11" y="13" width="26" height="22" rx="2" />
        <path d="M11 19 L37 19" />
        <path d="M16 10 L16 15" />
        <path d="M32 10 L32 15" />
        <circle cx="24" cy="27" r="3" />
      </g>
    </svg>
  )
}

export function FaqPaymentIllustration({ className, fill }: Props) {
  return (
    <svg {...faqSvg(className)}>
      <circle cx="24" cy="24" r="18" fill={fill ?? '#9ca893'} fillOpacity="0.3" />
      <g {...STROKE}>
        <rect x="9" y="15" width="30" height="20" rx="2" />
        <path d="M9 21 L39 21" />
        <path d="M14 28 L20 28" />
        <path d="M14 31 L24 31" opacity="0.5" />
        <circle cx="33" cy="33" r="5" fill="#faf7f2" />
        <circle cx="33" cy="33" r="5" />
        <text x="33" y="36" textAnchor="middle" fontSize="6" fontFamily="serif" fill="currentColor" fontWeight="500">$</text>
      </g>
    </svg>
  )
}

export function FaqReturnsIllustration({ className, fill }: Props) {
  return (
    <svg {...faqSvg(className)}>
      <circle cx="24" cy="24" r="18" fill={fill ?? '#e7c4c0'} fillOpacity="0.3" />
      <g {...STROKE}>
        <rect x="13" y="17" width="22" height="18" rx="1" />
        <path d="M13 23 L35 23" />
        <path d="M24 17 L24 35" />
        <path d="M30 11 L36 11 Q38 11, 38 13 L38 18" />
        <path d="M36 14 L38 18 L40 14" />
      </g>
    </svg>
  )
}

export function FaqRegulationsIllustration({ className, fill }: Props) {
  return (
    <svg {...faqSvg(className)}>
      <circle cx="24" cy="24" r="18" fill={fill ?? '#b85a4a'} fillOpacity="0.15" />
      <g {...STROKE}>
        <rect x="13" y="11" width="22" height="26" rx="1" />
        <path d="M17 17 L31 17" opacity="0.5" />
        <path d="M17 21 L29 21" opacity="0.5" />
        <path d="M17 25 L31 25" opacity="0.5" />
        <rect x="22" y="28" width="10" height="6" rx="0.5" transform="rotate(-3 27 31)" fill={fill ?? '#b85a4a'} fillOpacity="0.4" />
        <text x="27" y="33" textAnchor="middle" fontSize="4" fontFamily="serif" fill="currentColor" transform="rotate(-3 27 31)">承認</text>
      </g>
    </svg>
  )
}

/* ──────────────────────────────────────────────────────────
   Tier badges — 3 levels (bronze/silver/gold) — Japanese 御札 style
   ────────────────────────────────────────────────────────── */
function tierSvg(className?: string) {
  return {
    viewBox: '0 0 64 80',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className: className ?? 'w-12 h-16',
    'aria-hidden': true as const,
  }
}

interface TierBadgeProps extends Props {
  /** Character to print on the badge — defaults by level */
  char?: string
}

function TierBadgeBase({
  className,
  fill,
  bg,
  char,
  rotation = -2,
}: TierBadgeProps & { bg: string; rotation?: number }) {
  return (
    <svg {...tierSvg(className)}>
      <g transform={`rotate(${rotation} 32 40)`}>
        {/* Ofuda body — paper strip */}
        <path
          d="M22 8 L42 8 L46 16 L46 64 Q46 70, 40 72 L24 72 Q18 70, 18 64 L18 16 Z"
          fill={bg}
          stroke={fill ?? 'currentColor'}
          strokeWidth="1.5"
        />
        {/* top decorative band */}
        <path d="M22 16 L42 16" stroke={fill ?? 'currentColor'} strokeWidth="1.5" />
        <path d="M24 18 L40 18" stroke={fill ?? 'currentColor'} strokeWidth="1" opacity="0.5" />
        {/* hanging tassel */}
        <path d="M32 8 L32 4" stroke={fill ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="32" cy="3" r="1.5" fill={fill ?? 'currentColor'} />
        {/* big character */}
        <text
          x="32"
          y="48"
          textAnchor="middle"
          fontSize="24"
          fontFamily="var(--font-display), 'Shippori Mincho', serif"
          fill={fill ?? 'currentColor'}
          fontWeight="500"
        >
          {char}
        </text>
        {/* bottom small decoration */}
        <circle cx="32" cy="62" r="2" stroke={fill ?? 'currentColor'} strokeWidth="1" fill="none" opacity="0.6" />
      </g>
    </svg>
  )
}

export function TierBronzeIllustration(props: Props) {
  return <TierBadgeBase {...props} bg="#d8c0a3" fill="#8a6e4a" char="銅" rotation={-2} />
}

export function TierSilverIllustration(props: Props) {
  return <TierBadgeBase {...props} bg="#dadde0" fill="#5a6470" char="銀" rotation={1} />
}

export function TierGoldIllustration(props: Props) {
  return <TierBadgeBase {...props} bg="#f0d895" fill="#9c7a25" char="金" rotation={-1} />
}

export function AboutPackingIllustration({ className, fill }: Props) {
  return (
    <svg viewBox="0 0 160 140" {...svgProps(className ?? 'w-32 h-28')}>
      <ellipse cx="80" cy="118" rx="55" ry="6" fill={fill ?? '#e7c4c0'} fillOpacity="0.3" />

      <g {...STROKE}>
        {/* Open box */}
        <path d="M30 65 L80 50 L130 65 L130 110 L30 110 Z" />
        <path d="M30 65 L130 65" />
        <path d="M80 50 L80 65" opacity="0.5" />
        {/* Tape on box */}
        <path d="M55 65 L55 110" opacity="0.4" strokeDasharray="2 2" />
        <path d="M105 65 L105 110" opacity="0.4" strokeDasharray="2 2" />
        {/* Ribbon */}
        <path d="M30 88 L130 88" />
        {/* bow */}
        <path d="M80 88 Q70 80, 75 86 Q80 92, 80 88" />
        <path d="M80 88 Q90 80, 85 86 Q80 92, 80 88" />

        {/* Card on top */}
        <g transform="translate(50 35) rotate(-6)">
          <rect x="0" y="0" width="30" height="20" rx="1" />
          <path d="M3 6 L27 6" opacity="0.4" />
          <path d="M3 11 L20 11" opacity="0.4" />
          {/* heart */}
          <path d="M22 14 Q21 13, 22 12 Q23 11, 24 12 Q25 11, 26 12 Q27 13, 26 14 L24 16 Z" fill={fill ?? '#e7c4c0'} fillOpacity="0.5" />
        </g>
      </g>
    </svg>
  )
}
