'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'

/**
 * Fires a brand-tinted confetti burst on mount. Mounted once on the
 * checkout success page right under the illustration.
 */
export function SuccessConfetti() {
  useEffect(() => {
    const colors = ['#e8896c', '#e7c4c0', '#9ca893', '#e8d9b9', '#b85a4a']
    const duration = 1500

    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        particleCount: Math.floor(120 * particleRatio),
        spread: 70,
        origin: { y: 0.4 },
        colors,
        scalar: 0.85,
        gravity: 0.9,
        ticks: 200,
        ...opts,
      })
    }

    fire(0.25, { spread: 26, startVelocity: 55 })
    fire(0.2, { spread: 60 })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
    fire(0.1, { spread: 120, startVelocity: 45 })

    const t = setTimeout(() => {
      // tail-end petals
      confetti({
        particleCount: 30,
        spread: 360,
        origin: { y: 0.3 },
        colors,
        shapes: ['circle'],
        scalar: 0.6,
        gravity: 0.6,
      })
    }, duration)

    return () => clearTimeout(t)
  }, [])

  return null
}
