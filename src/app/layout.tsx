import type { Metadata, Viewport } from 'next'
import {
  Noto_Sans_TC,
  Noto_Serif_TC,
  Noto_Serif_JP,
  Shippori_Mincho,
  Klee_One,
} from 'next/font/google'
import './globals.css'
import { organizationLd, websiteLd, jsonLdScript } from '@/lib/jsonld'
import { Toaster } from '@/components/shared/Toaster'

// Body text: Noto Sans TC, light → medium for proper rhythm
const notoSans = Noto_Sans_TC({
  variable: '--font-noto-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
})

// Headlines (zh): Noto Serif TC fallback
const notoSerif = Noto_Serif_TC({
  variable: '--font-noto-serif',
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  preload: false,
})

// Headlines (jp): Noto Serif JP fallback
const notoSerifJp = Noto_Serif_JP({
  variable: '--font-noto-serif-jp',
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  preload: false,
})

// Brand display: Shippori Mincho — used for big serifs / hero / price
const shippori = Shippori_Mincho({
  variable: '--font-shippori',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: false,
})

// Hand-written warmth: Klee One — used for jp tags / subtitles / "本日のおすすめ"
const klee = Klee_One({
  variable: '--font-klee',
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ccbabylife.com'),
  title: {
    default: '熙熙初日｜日系選物店 — 1 歲寶寶媽媽親身試用、嚴選日系母嬰用品',
    template: '%s ｜熙熙初日 日系選物店',
  },
  description:
    '1 歲寶寶媽媽親身試用、嚴選日本品牌母嬰與寵物用品。每週日截單、週一日本下單、10–14 天到貨。誠實揭露日幣定價、運費、服務費，不販售需查驗登記之嬰兒奶粉、藥品、含肉寵物食品。',
  keywords: [
    '日系選物', '日本代購', '日本母嬰用品', '嬰兒用品推薦',
    '日本紗布巾', '日本嬰兒服飾', 'MikiHouse', 'Pigeon', 'Combi',
    '寶寶月齡推薦', '彌月禮', '日本寵物用品', '法規誠信',
  ],
  authors: [{ name: '熙熙初日' }],
  appleWebApp: {
    capable: true,
    title: '熙熙初日',
    statusBarStyle: 'default',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    siteName: '熙熙初日｜日系選物店',
    title: '熙熙初日｜日系選物店 — 1 歲寶寶媽媽親身試用、嚴選日系母嬰用品',
    description:
      '1 歲寶寶媽媽親身試用、嚴選日本品牌母嬰與寵物用品。每週日截單、10–14 天到貨。誠信透明、不販售需查驗登記商品。',
  },
  twitter: {
    card: 'summary_large_image',
    title: '熙熙初日｜日系選物店',
    description:
      '1 歲寶寶媽媽親身試用、嚴選日系母嬰用品。每週日截單、10–14 天到貨。',
  },
  other: {
    google: 'notranslate',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2d2a26',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-Hant"
      className={`${notoSans.variable} ${notoSerif.variable} ${notoSerifJp.variable} ${shippori.variable} ${klee.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-cream text-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(websiteLd()) }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  )
}
