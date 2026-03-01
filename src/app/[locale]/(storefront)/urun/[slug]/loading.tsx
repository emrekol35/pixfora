export default function ProductDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image skeleton */}
        <div className="aspect-square bg-muted rounded-xl animate-pulse" />

        {/* Info skeleton */}
        <div className="space-y-4">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          <div className="h-px bg-border my-4" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex gap-3 mt-6">
            <div className="h-12 flex-1 bg-muted rounded-lg animate-pulse" />
            <div className="h-12 w-12 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
