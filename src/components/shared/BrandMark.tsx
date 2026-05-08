/**
 * Brand mark — Japanese ハンコ-style stamp containing the character 「初」
 * (from 熙熙初日; means "first / beginning").
 *
 * Renders the actual character via SVG <text> using our brand serif font
 * so it's instantly readable at any size and matches the 印章 visual idiom.
 */
interface Props {
  className?: string
}

export function BrandMark({ className = 'w-8 h-8' }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Slight tilt for hand-stamped feel */}
      <g transform="rotate(-3 16 16)">
        {/* Solid filled square — looks like a real chop print */}
        <rect x="2" y="2" width="28" height="28" rx="2" fill="currentColor" />
        {/* The character itself, knocked out to background color */}
        <text
          x="16"
          y="17"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="var(--font-display), 'Shippori Mincho', 'Songti TC', serif"
          fontSize="22"
          fontWeight="500"
          fill="#faf7f2"
          style={{ letterSpacing: 0 }}
        >
          初
        </text>
      </g>
    </svg>
  )
}
