import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BROAD_CATEGORIES } from '@/lib/broadCategories';
import { Image } from '@/components/ui/image';

const tileColors = [
  'bg-[#E8F5E9]',
  'bg-[#F1F8E9]',
  'bg-[#FFFDE7]',
  'bg-[#FFF3E0]',
  'bg-[#FBE9E7]',
  'bg-[#E0F7FA]',
];

export default function FeaturedCategories() {
  const navigate = useNavigate();

  return (
    <section className="px-4">
      <h2 className="text-lg font-bold text-gray-900 mb-2">Shop by Category</h2>
      <div className="grid grid-cols-3 gap-2.5">
        {BROAD_CATEGORIES.map((cat, i) => (
          <button
            key={cat.slug}
            onClick={() => navigate(cat.route || `/shop/${cat.slug}`)}
            className="bg-white rounded-2xl border border-gray-100 p-2.5 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
          >
            <div
              className={`w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center ${
                tileColors[i % tileColors.length]
              }`}
            >
              {cat.image ? (
                <Image
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full"
                  fittingType="fill"
                />
              ) : (
                <span className="text-3xl">{cat.icon}</span>
              )}
            </div>
            <div className="text-center">
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