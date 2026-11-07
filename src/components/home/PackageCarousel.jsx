import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import PackageCard from '@/components/package/PackageCard';

export default function PackageCarousel({ packages }) {
  const navigate = useNavigate();
  const essentials = (packages || []).filter((p) => p.group !== 'meal_kits' && p.active !== false);
  if (!essentials.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between px-4 mb-2">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Grocery Packages</h2>
          <p className="text-xs text-gray-500">Curated bundles, ready in minutes</p>
        </div>
        <button onClick={() => navigate('/packages')} className="text-xs font-semibold text-[#2E7D32] flex items-center">
          See All <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 px-4 scrollbar-hide snap-x">
        {essentials.map((pkg) => (
          <div key={pkg.id} className="snap-start">
            <PackageCard pkg={pkg} />
          </div>
        ))}
      </div>
    </section>
  );
}