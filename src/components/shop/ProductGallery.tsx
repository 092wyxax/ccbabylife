'use client'

import { useEffect, useState } from 'react'
import { imageUrl } from '@/lib/image'

interface Image {
  id: string
  cfImageId: string
  altText: string | null
}

interface Props {
  images: Image[]
  productName: string
}

export function ProductGallery({ images, productName }: Props) {
  const [active, setActive] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)

  useEffect(() => {
    if (!zoomOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [zoomOpen])

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-cream-100 border border-line rounded-md flex items-center justify-center text-ink-soft text-sm">
        尚無商品圖
      </div>
    )
  }

  const main = images[active]

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          className="block w-full aspect-square bg-cream-100 border border-line rounded-md overflow-hidden cursor-zoom-in group"
          aria-label="點擊放大"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl(main.cfImageId)}
            alt={main.altText ?? productName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </button>

        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {images.map((img, i) => (
              <button
                type="button"
                key={img.id}
                onClick={() => setActive(i)}
                className={
                  'aspect-square bg-cream-100 border-2 rounded-md overflow-hidden transition-colors ' +
                  (i === active ? 'border-ink' : 'border-line hover:border-ink/40')
                }
                aria-label={`查看圖片 ${i + 1}`}
                aria-pressed={i === active}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl(img.cfImageId)}
                  alt={img.altText ?? productName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {zoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="商品圖片放大"
          onClick={() => setZoomOpen(false)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 sm:p-10 cursor-zoom-out"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setZoomOpen(false)
            }}
            aria-label="關閉"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white text-3xl leading-none w-10 h-10 flex items-center justify-center hover:opacity-70"
          >
            ×
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setActive((active - 1 + images.length) % images.length)
                }}
                aria-label="上一張"
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 text-white text-4xl leading-none w-12 h-12 flex items-center justify-center hover:opacity-70"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setActive((active + 1) % images.length)
                }}
                aria-label="下一張"
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 text-white text-4xl leading-none w-12 h-12 flex items-center justify-center hover:opacity-70"
              >
                ›
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl(main.cfImageId)}
            alt={main.altText ?? productName}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-jp"
            >
              {active + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  )
}
