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
  title: {
    default: '熙熙初日｜日系選物店',
    template: '%s | 熙熙初日｜日系選物店',
  },
  description: '1 歲寶寶媽媽親身試用、嚴選日系好物、不販售需查驗登記商品',
  appleWebApp: {
    capable: true,
    title: '熙熙初日',
    statusBarStyle: 'default',
  },
  other: {
    'google': 'notranslate',
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
