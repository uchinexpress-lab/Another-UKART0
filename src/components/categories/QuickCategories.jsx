import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BROAD_CATEGORIES } from '@/lib/broadCategories';
import { Image } from '@/components/ui/image';

export default function QuickCategories() {
  const navigate = useNavigate();

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 pt-3 -mx-4 px-4 scrollbar-hide">
      {BROAD_CATEGORIES.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => navigate(cat.route || `/shop/${cat.slug}`)}
          className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16 no-tap-highlight active:scale-90 transition-transform"
        >
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#E8F5E9] flex items-center justify-center">
            {cat.image ? (
              <Image
                src={cat.image}
                alt={cat.name}
                className="w-full h-full"
                fittingType="fill"
              />
            ) : (
              <span className="text-2xl">{cat.icon}</span>
            )}
          </div>
          <span className="text-[10px] font-medium text-gray-700 text-center leading-tight">
            {cat.name}
          </span>
        </button>
      ))}
    </div>
  );
}