"use client";

import ProductCard from "./ProductCard";

interface HomeProductsProps {
  products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice: number | null;
    stock: number;
    minQty: number;
    maxQty: number | null;
    isFeatured: boolean;
    images: { url: string; alt: string | null }[];
    category: { name: string } | null;
    brand: { name: string } | null;
  }[];
}

export default function HomeProducts({ products }: HomeProductsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
