'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  children: React.ReactNode
  delay?: number
  className?: string
  /** Animate from below (default) or other directions */
  from?: 'bottom' | 'left' | 'right' | 'fade'
}

export function FadeIn({ children, delay = 0, className = '', from = 'bottom' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTimeout(() => setVisible(true), delay)
          obs.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [delay])

  const baseTransform =
    from === 'bottom' ? 'translateY(20px)'
    : from === 'left' ? 'translateX(-20px)'
    : from === 'right' ? 'translateX(20px)'
    : 'none'

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : baseTransform,
        transition: 'opacity 600ms ease-out, transform 600ms ease-out',
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}
