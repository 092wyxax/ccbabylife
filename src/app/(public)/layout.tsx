import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { CutoffCountdown } from '@/components/shared/CutoffCountdown'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <CutoffCountdown variant="banner" />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
