interface Props {
  className?: string
}

export function SectionDivider({ className = '' }: Props) {
  return (
    <div
      aria-hidden
      className={`mx-auto max-w-6xl px-4 sm:px-6 ${className}`}
    >
      <div className="flex items-center gap-4 py-1">
        <span className="flex-1 dot-divider" />
        <span className="font-jp text-ink-soft text-sm tracking-[0.4em]">和</span>
        <span className="flex-1 dot-divider" />
      </div>
    </div>
  )
}
