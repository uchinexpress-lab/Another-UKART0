import React from 'react';
import ProductCard from '@/components/product/ProductCard';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BestSellers({ products }) {
  const navigate = useNavigate();
  if (!products?.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between px-4 mb-2">
        <h2 className="text-lg font-bold text-gray-900">Best Sellers</h2>
        <button onClick={() => navigate('/categories')} className="text-xs font-semibold text-[#2E7D32] flex items-center">
          See All <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 px-4 scrollbar-hide">
        {products.map((p) => (
          <div key={p.id} className="w-36 flex-shrink-0">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}