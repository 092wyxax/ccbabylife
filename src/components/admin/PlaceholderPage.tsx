interface Props {
  title: string
  subtitle: string
  comingPhase: string
  bullets?: string[]
}

export function PlaceholderPage({ title, subtitle, comingPhase, bullets }: Props) {
  return (
    <div className="p-8 max-w-3xl">
      <h1 className="font-serif text-2xl mb-1">{title}</h1>
      <p className="text-ink-soft text-sm mb-8">{subtitle}</p>

      <div className="bg-cream-100 border border-line rounded-lg p-6 text-sm">
        <p className="font-medium mb-2">{comingPhase} 開放</p>
        {bullets && (
          <ul className="space-y-1 text-ink-soft list-disc list-inside">
            {bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
