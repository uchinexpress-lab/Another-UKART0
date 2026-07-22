import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BROAD_CATEGORIES } from '@/lib/broadCategories';
import { Image } from '@/components/ui/image';

export default function FeaturedCategories() {
  const navigate = useNavigate();

  return (
    <section className="px-4">
      <h2 className="text-lg font-bold text-gray-900 mb-3">Shop by Category</h2>
      <div className="grid grid-cols-3 gap-3">
        {BROAD_CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => navigate(cat.route || `/shop/${cat.slug}`)}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col active:scale-95 transition-transform"
          >
            <div className="w-full aspect-square flex items-center justify-center">
              {cat.image ? (
                <Image
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full"
                  fittingType="fill"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl bg-[#E8F5E9]">
                  {cat.icon}
                </div>
              )}
            </div>
            <div className="text-center p-2 pt-1.5">
              <div className="text-xs font-bold text-gray-900 leading-tight">{cat.name}</div>
              <div className="text-[10px] text-gray-400 leading-tight mt-0.5 line-clamp-1">
                {cat.example}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}