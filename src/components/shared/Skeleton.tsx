interface Props {
  className?: string
}

export function Skeleton({ className = '' }: Props) {
  return (
    <div
      className={
        'animate-pulse bg-gradient-to-r from-cream-100 via-line to-cream-100 rounded-md ' +
        className
      }
    />
  )
}
