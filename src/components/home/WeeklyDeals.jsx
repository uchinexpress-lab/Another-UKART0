import React from 'react';
import ProductCard from '@/components/product/ProductCard';
import { Flame } from 'lucide-react';

export default function WeeklyDeals({ products }) {
  if (!products?.length) return null;

  return (
    <section className="px-4">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-5 h-5 text-[#FF6B35]" />
        <h2 className="text-lg font-bold text-gray-900">Weekly Deals</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}