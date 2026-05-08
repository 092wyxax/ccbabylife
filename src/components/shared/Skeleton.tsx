interface Props {
  className?: string
}

/** Generic shimmer skeleton block. Pairs with .skeleton class in globals.css */
export function Skeleton({ className = '' }: Props) {
  return <div className={`skeleton rounded-md ${className}`} aria-hidden />
}

/** Product card skeleton matching ProductCard layout */
export function ProductCardSkeleton() {
  return (
    <div className="block">
      <div className="bg-cream-100 rounded-md aspect-square mb-3 skeleton" />
      <Skeleton className="h-3 w-16 mb-2" />
      <Skeleton className="h-4 w-full mb-1.5" />
      <Skeleton className="h-4 w-3/4 mb-3" />
      <Skeleton className="h-5 w-20" />
    </div>
  )
}

/** Grid of product card skeletons for /shop loading state */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}
