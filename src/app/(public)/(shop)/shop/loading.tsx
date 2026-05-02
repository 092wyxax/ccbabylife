import { Skeleton } from '@/components/shared/Skeleton'

export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <header className="mb-8">
        <Skeleton className="h-10 w-48 mb-3" />
        <Skeleton className="h-4 w-64" />
      </header>
      <div className="mb-10 flex gap-2 pb-4 border-b border-line">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
        {[...Array(8)].map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-square w-full mb-3" />
            <Skeleton className="h-3 w-12 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
