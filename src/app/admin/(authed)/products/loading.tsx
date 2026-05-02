import { Skeleton } from '@/components/shared/Skeleton'

export default function ProductsLoading() {
  return (
    <div className="p-8 max-w-7xl">
      <header className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </header>
      <Skeleton className="h-10 w-72 rounded-md mb-4" />
      <div className="bg-white border border-line rounded-lg p-3 mb-4 flex gap-2">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-6 w-16 rounded-full" />
        ))}
      </div>
      <div className="bg-white border border-line rounded-lg overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="border-t border-line first:border-t-0 px-4 py-3 flex gap-4 items-center">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
