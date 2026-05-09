import dynamic from 'next/dynamic'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { CutoffCountdown } from '@/components/shared/CutoffCountdown'
import { CartSyncBridge } from '@/components/cart/CartSyncBridge'
import { ToastViewport } from '@/components/shared/Toast'
import { MobileBottomNav } from '@/components/shared/MobileBottomNav'
import { HeaderScrollHide } from '@/components/shared/HeaderScrollHide'

// Lazy-load non-critical UI — keeps these out of the initial JS chunk.
// All target components are already 'use client' with effect-gated rendering,
// so their SSR phase is essentially empty.
const OnboardingWizard = dynamic(
  () => import('@/components/shared/OnboardingWizard').then((m) => m.OnboardingWizard)
)
const LineFloatingButton = dynamic(
  () => import('@/components/shared/LineFloatingButton').then((m) => m.LineFloatingButton)
)
const NewsletterPopup = dynamic(
  () => import('@/components/shared/NewsletterPopup').then((m) => m.NewsletterPopup)
)
const RegisterServiceWorker = dynamic(
  () => import('@/components/shared/RegisterServiceWorker').then((m) => m.RegisterServiceWorker)
)

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <CutoffCountdown variant="banner" />
      <Header />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <Footer />
      <ToastViewport />
      <MobileBottomNav />
      <HeaderScrollHide />
      <CartSyncBridge />
      <OnboardingWizard />
      <LineFloatingButton />
      <NewsletterPopup />
      <RegisterServiceWorker />
    </div>
  )
}
