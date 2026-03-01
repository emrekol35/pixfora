import ProductGridSkeleton from "@/components/storefront/ProductGridSkeleton";

export default function SearchLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="h-8 w-56 bg-muted rounded animate-pulse mb-8" />
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Skeleton */}
        <aside className="hidden md:block w-64 shrink-0 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="h-4 w-20 bg-muted rounded animate-pulse mb-3" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-4 bg-muted rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </aside>
        {/* Grid Skeleton */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-8 w-36 bg-muted rounded animate-pulse" />
          </div>
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </div>
  );
}
