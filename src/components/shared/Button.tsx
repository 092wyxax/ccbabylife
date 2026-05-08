import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-ink text-cream hover:bg-accent disabled:bg-ink/40',
  secondary:
    'bg-cream text-ink border border-line hover:border-ink disabled:opacity-50',
  ghost:
    'text-ink-soft hover:text-ink hover:bg-cream-100 disabled:opacity-50',
  danger:
    'bg-danger/10 text-danger border border-danger/30 hover:bg-danger hover:text-cream',
}

const SIZES: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-md',
  md: 'text-sm px-4 py-2 rounded-md',
  lg: 'text-sm px-6 py-3 rounded-md tracking-[0.15em]',
}

const BASE =
  'inline-flex items-center justify-center gap-2 font-jp transition-colors disabled:cursor-not-allowed select-none'

interface ButtonBase {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}

type ButtonProps = ButtonBase & ComponentProps<'button'>

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {children}
    </button>
  )
}

type ButtonLinkProps = ButtonBase & Omit<ComponentProps<typeof Link>, 'className'>

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      {...rest}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {children}
    </Link>
  )
}
