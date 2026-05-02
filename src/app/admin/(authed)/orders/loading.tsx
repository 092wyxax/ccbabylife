import { Skeleton } from '@/components/shared/Skeleton'

export default function OrdersLoading() {
  return (
    <div className="p-8 max-w-7xl">
      <Skeleton className="h-7 w-32 mb-2" />
      <Skeleton className="h-4 w-20 mb-6" />
      <Skeleton className="h-10 w-72 rounded-md mb-4" />
      <div className="bg-white border border-line rounded-lg overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="border-t border-line first:border-t-0 px-4 py-3 flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-20 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
