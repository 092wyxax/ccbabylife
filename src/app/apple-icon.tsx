import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F5EFE6',
          color: '#2D2A26',
          fontSize: 130,
          fontWeight: 700,
          fontFamily: 'serif',
        }}
      >
        初
      </div>
    ),
    { ...size }
  )
}
