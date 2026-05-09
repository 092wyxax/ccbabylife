'use client'

import { useEffect } from 'react'

/**
 * Mounted once in public layout. On mobile (< lg), hides the sticky header
 * when the user scrolls down and reveals it when scrolling up.
 *
 * Uses a CSS variable `--header-y` we toggle on body — Header reads it via
 * inline transform style (set in globals.css below).
 */
export function HeaderScrollHide() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    let lastY = window.scrollY
    let ticking = false
    const html = document.documentElement

    const update = () => {
      const y = window.scrollY
      const goingDown = y > lastY && y > 80
      const goingUp = y < lastY
      if (goingDown) {
        html.dataset.headerHidden = 'true'
      } else if (goingUp || y < 40) {
        delete html.dataset.headerHidden
      }
      lastY = y
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return null
}
