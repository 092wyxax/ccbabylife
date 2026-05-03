interface Props {
  char?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: 'w-10 h-10 text-base',
  md: 'w-14 h-14 text-xl',
  lg: 'w-20 h-20 text-3xl',
}

export function SealStamp({ char = '選', size = 'md', className = '' }: Props) {
  return (
    <span
      aria-hidden
      className={`seal-stamp ${SIZES[size]} ${className}`}
    >
      {char}
    </span>
  )
}
