import { ImageResponse } from 'next/og'
import { getProductBySlug } from '@/server/services/ProductService'
import { formatTwd } from '@/lib/format'

export const alt = '熙熙初日｜日系選物店 — 商品'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface Props {
  params: { slug: string }
}

export default async function Image({ params }: Props) {
  const detail = await getProductBySlug(params.slug)
  if (!detail) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#faf7f2',
            color: '#2d2a26',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 60,
          }}
        >
          熙熙初日
        </div>
      ),
      { ...size }
    )
  }

  const { product, brand } = detail

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
          padding: '70px',
          fontFamily: 'serif',
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 8, color: '#7a756f' }}>
          NIHON SELECT
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {brand && (
            <div style={{ fontSize: 22, color: '#7a756f', textTransform: 'uppercase', letterSpacing: 6, marginBottom: 16 }}>
              {brand.nameZh}
            </div>
          )}
          <div style={{ fontSize: 68, lineHeight: 1.15, maxWidth: 900, marginBottom: 24 }}>
            {product.nameZh}
          </div>
          <div style={{ fontSize: 48, color: '#e8896c' }}>
            {formatTwd(product.priceTwd)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
          <span
            style={{
              fontSize: 18,
              padding: '8px 20px',
              background: '#2d2a26',
              color: '#faf7f2',
              borderRadius: 999,
            }}
          >
            {product.stockType === 'preorder' ? '預購' : '現貨'}
          </span>
          <span
            style={{
              fontSize: 18,
              padding: '8px 20px',
              border: '1px solid #e8e4dd',
              borderRadius: 999,
            }}
          >
            熙熙初日 · 日本媽媽嚴選
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
