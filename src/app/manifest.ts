import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '熙熙初日 · 日系選物店',
    short_name: '熙熙初日',
    description: '日本親選母嬰、寵物選物 — 予約制電商',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf7f2',
    theme_color: '#2d2a26',
    orientation: 'portrait',
    lang: 'zh-Hant',
    scope: '/',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: '購物車',
        url: '/cart',
        description: '查看購物車',
      },
      {
        name: '我的訂單',
        url: '/account/orders',
        description: '查看訂單進度',
      },
      {
        name: '所有選物',
        url: '/shop',
        description: '瀏覽所有商品',
      },
    ],
  }
}
