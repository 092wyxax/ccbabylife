import { CheckoutForm } from '@/components/checkout/CheckoutForm'

export const metadata = {
  title: '結帳 | 日系選物店',
}

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">Checkout</p>
      <h1 className="font-serif text-3xl mb-8">結帳</h1>

      <CheckoutForm />
    </div>
  )
}
