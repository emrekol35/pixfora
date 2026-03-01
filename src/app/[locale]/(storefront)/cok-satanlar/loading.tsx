import ProductGridSkeleton from "@/components/storefront/ProductGridSkeleton";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="h-4 bg-muted rounded w-48 mb-6 animate-pulse" />
      <div className="h-8 bg-muted rounded w-64 mb-2 animate-pulse" />
      <div className="h-4 bg-muted rounded w-32 mb-8 animate-pulse" />
      <ProductGridSkeleton count={8} />
    </div>
  );
}
