import React from 'react';
import { Link } from 'react-router-dom';
import DealCard from '@/components/product/DealCard';
import { Flame, ChevronRight } from 'lucide-react';

export default function WeeklyDeals({ products }) {
  if (!products?.length) return null;
  const deals = products.slice(0, 6);

  return (
    <section className="px-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-[#FF6B35]" />
          <h2 className="text-lg font-bold text-gray-900">Weekly Deals</h2>
        </div>
        <Link
          to="/offers"
          className="flex items-center gap-0.5 text-xs font-semibold text-[#2E7D32] active:scale-95 transition-transform">
          
          See All <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {deals.map((p) =>
        <DealCard key={p.id} product={p} />
        )}
      </div>
    </section>);

}