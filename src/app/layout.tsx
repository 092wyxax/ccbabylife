import type { Metadata, Viewport } from 'next'
import { Noto_Sans_TC, Noto_Serif_TC, Noto_Serif_JP, Shippori_Mincho } from 'next/font/google'
import './globals.css'
import { organizationLd, websiteLd, jsonLdScript } from '@/lib/jsonld'
import { Toaster } from '@/components/shared/Toaster'

const notoSans = Noto_Sans_TC({
  variable: '--font-noto-sans',
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
})

const notoSerif = Noto_Serif_TC({
  variable: '--font-noto-serif',
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  preload: false,
})

const notoSerifJp = Noto_Serif_JP({
  variable: '--font-noto-serif-jp',
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  preload: false,
})

const shippori = Shippori_Mincho({
  variable: '--font-shippori',
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: {
    default: '熙熙初日｜日系選物店',
    template: '%s | 熙熙初日｜日系選物店',
  },
  description: '1 歲娃媽親身試用、嚴選日系好物、不賣需查驗登記商品',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: '熙熙初日',
    statusBarStyle: 'default',
  },
  icons: {
    apple: '/apple-icon-180.png',
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
      className={`${notoSans.variable} ${notoSerif.variable} ${notoSerifJp.variable} ${shippori.variable} h-full antialiased`}
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
