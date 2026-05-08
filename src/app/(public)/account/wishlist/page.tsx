import { WishlistContents } from '@/components/account/WishlistContents'

export const metadata = { title: '我的收藏' }

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-2">
        WISHLIST · お気に入り
      </p>
      <h1 className="font-serif text-3xl tracking-wide mb-8">我的收藏</h1>
      <WishlistContents />
    </div>
  )
}
