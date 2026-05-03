import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = '熙熙初日｜日系選物店'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#faf7f2',
          color: '#2d2a26',
          display: 'flex',
          flexDirection: 'column',
          padding: '80px',
          fontFamily: 'serif',
        }}
      >
        <div style={{ fontSize: 24, letterSpacing: 8, color: '#7a756f' }}>
          NIHON SELECT
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 90, lineHeight: 1.1 }}>熙熙初日</div>
        <div style={{ fontSize: 28, color: '#7a756f', marginTop: 12, letterSpacing: 4 }}>
          日系選物店
        </div>
        <div style={{ fontSize: 36, color: '#7a756f', marginTop: 24 }}>
          1 歲娃媽親身試用、嚴選日系好物
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
          <span
            style={{
              fontSize: 18,
              padding: '8px 20px',
              background: '#e8896c',
              color: '#faf7f2',
              borderRadius: 999,
            }}
          >
            預購制 · 每週日截單
          </span>
          <span
            style={{
              fontSize: 18,
              padding: '8px 20px',
              border: '1px solid #e8e4dd',
              borderRadius: 999,
            }}
          >
            不賣需查驗登記商品
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
