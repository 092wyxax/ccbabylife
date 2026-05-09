/**
 * Fires a "shrinking-image flies to cart icon" animation.
 *
 * Usage from any client component:
 *   import { flyToCart } from '@/lib/fly-to-cart'
 *   onClick={(e) => {
 *     flyToCart(e.currentTarget.querySelector('img'))  // origin element
 *     add(item)
 *   }}
 *
 * Falls back silently if no cart icon found OR motion-reduced.
 */
export function flyToCart(originEl: Element | null) {
  if (typeof window === 'undefined') return
  if (!originEl) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  // Find the cart icon (data attribute set in CartIndicator)
  const target = document.querySelector('[data-cart-icon]') as HTMLElement | null
  if (!target) return

  const originRect = (originEl as HTMLElement).getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()

  // Make a flying ghost
  const ghost = document.createElement('div')
  ghost.style.cssText = `
    position: fixed;
    left: ${originRect.left}px;
    top: ${originRect.top}px;
    width: ${originRect.width}px;
    height: ${originRect.height}px;
    border-radius: 8px;
    background-image: ${
      originEl instanceof HTMLImageElement && originEl.src
        ? `url(${JSON.stringify(originEl.src)})`
        : 'linear-gradient(135deg, #e8896c, #e7c4c0)'
    };
    background-size: cover;
    background-position: center;
    z-index: 9999;
    pointer-events: none;
    transition: transform 650ms cubic-bezier(0.4, 0, 0.2, 1), opacity 650ms ease, scale 650ms cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    will-change: transform, opacity;
  `
  document.body.appendChild(ghost)

  // Trigger transform on next frame
  requestAnimationFrame(() => {
    const dx = targetRect.left + targetRect.width / 2 - (originRect.left + originRect.width / 2)
    const dy = targetRect.top + targetRect.height / 2 - (originRect.top + originRect.height / 2)
    ghost.style.transform = `translate(${dx}px, ${dy}px) scale(0.15) rotate(15deg)`
    ghost.style.opacity = '0.4'
  })

  // Cleanup + bump cart icon
  setTimeout(() => {
    ghost.remove()
    target.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.25)' },
        { transform: 'scale(1)' },
      ],
      { duration: 320, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
    )
  }, 700)
}
