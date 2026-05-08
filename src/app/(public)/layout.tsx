import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { CutoffCountdown } from '@/components/shared/CutoffCountdown'
import { OnboardingWizard } from '@/components/shared/OnboardingWizard'
import { CartSyncBridge } from '@/components/cart/CartSyncBridge'
import { LineFloatingButton } from '@/components/shared/LineFloatingButton'
import { ToastViewport } from '@/components/shared/Toast'
import { NewsletterPopup } from '@/components/shared/NewsletterPopup'
import { MobileBottomNav } from '@/components/shared/MobileBottomNav'
import { RegisterServiceWorker } from '@/components/shared/RegisterServiceWorker'

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
      <OnboardingWizard />
      <CartSyncBridge />
      <LineFloatingButton />
      <ToastViewport />
      <NewsletterPopup />
      <MobileBottomNav />
      <RegisterServiceWorker />
    </div>
  )
}
