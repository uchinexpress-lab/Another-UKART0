import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BROAD_CATEGORIES } from '@/lib/broadCategories';
import { Image } from '@/components/ui/image';

export default function Categories() {
  const navigate = useNavigate();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Categories</h1>
      <div className="grid grid-cols-2 gap-3">
        {BROAD_CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => navigate(cat.route || `/shop/${cat.slug}`)}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col active:scale-95 transition-transform"
          >
            <div className="w-full aspect-[4/3] flex items-center justify-center">
              {cat.image ? (
                <Image
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full"
                  fittingType="fill"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl bg-[#E8F5E9]">
                  {cat.icon}
                </div>
              )}
            </div>
            <div className="p-3 text-left">
              <div className="text-sm font-bold text-gray-900 leading-tight">{cat.name}</div>
              <div className="text-[11px] text-gray-400 leading-tight mt-0.5">
                {cat.example}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}