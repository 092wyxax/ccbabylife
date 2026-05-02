'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        className: 'font-sans',
        style: {
          background: '#faf7f2',
          border: '1px solid #e8e4dd',
          color: '#2d2a26',
        },
      }}
    />
  )
}
