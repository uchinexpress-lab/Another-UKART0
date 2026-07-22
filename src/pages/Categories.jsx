import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BROAD_CATEGORIES } from '@/lib/broadCategories';

const tileColors = [
  'bg-[#E8F5E9]',
  'bg-[#F1F8E9]',
  'bg-[#FFFDE7]',
  'bg-[#FFF3E0]',
  'bg-[#FBE9E7]',
  'bg-[#E0F7FA]',
  'bg-[#F3E5F5]',
];

export default function Categories() {
  const navigate = useNavigate();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Categories</h1>
      <div className="grid grid-cols-2 gap-3">
        {BROAD_CATEGORIES.map((cat, i) => (
          <button
            key={cat.slug}
            onClick={() => navigate(cat.route || `/shop/${cat.slug}`)}
            className="bg-white rounded-2xl border border-gray-100 p-4 h-32 flex items-center gap-3 active:scale-95 transition-transform"
          >
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 ${
                tileColors[i % tileColors.length]
              }`}
            >
              {cat.icon}
            </div>
            <div className="text-left">
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