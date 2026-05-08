/**
 * Brand mark — 印章-style stylized 「初」 character set in a square seal,
 * with our seal red color. Use as small icon next to the wordmark.
 */
interface Props {
  className?: string
}

export function BrandMark({ className = 'w-8 h-8' }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Seal square frame, slightly rotated for hand-stamped feel */}
      <g transform="rotate(-2 16 16)">
        <rect
          x="2.5"
          y="2.5"
          width="27"
          height="27"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        {/* Stylized "初" — simplified strokes */}
        <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* 衣 part — left radical (clothing) */}
          <path d="M9 9 L9 22" />
          <path d="M7 12 L11 12" />
          <path d="M7 16 L11 16" />
          <path d="M8 22 L10 22" />
          {/* 刀 part — right radical (knife) */}
          <path d="M15 8 L23 8" />
          <path d="M19 8 L19 18" />
          <path d="M19 18 Q19 22, 23 22" />
          <path d="M15 13 L19 13" />
        </g>
      </g>
    </svg>
  )
}
