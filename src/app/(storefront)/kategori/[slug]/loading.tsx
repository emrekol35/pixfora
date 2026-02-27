import ProductGridSkeleton from "@/components/storefront/ProductGridSkeleton";

export default function CategoryLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
      <div className="h-4 w-64 bg-muted rounded animate-pulse mb-8" />
      <ProductGridSkeleton count={8} />
    </div>
  );
}
