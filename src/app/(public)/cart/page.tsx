import { CartContents } from '@/components/cart/CartContents'

export const metadata = {
  title: '購物車 | 日系選物店',
}

export default function CartPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">Cart</p>
        <h1 className="font-serif text-3xl">購物車</h1>
      </header>
      <CartContents />
    </div>
  )
}
