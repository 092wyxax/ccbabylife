import { CartContents } from '@/components/cart/CartContents'

export const metadata = {
  title: '購物車',
}

export default function CartPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <header className="mb-8">
        <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">CART · お買い物かご</p>
        <h1 className="font-serif text-3xl tracking-wide">購物車</h1>
      </header>
      <CartContents />
    </div>
  )
}
