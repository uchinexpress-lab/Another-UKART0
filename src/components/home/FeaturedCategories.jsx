import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const tileColors = [
  'bg-[#E8F5E9]',
  'bg-[#FFF8E1]',
  'bg-[#FCE4EC]',
  'bg-[#FFF3E0]',
  'bg-[#F3E5F5]',
  'bg-[#E0F7FA]',
];

export default function FeaturedCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let mounted = true;
    base44.entities.Category.filter(
      { is_hidden: { $ne: true } },
      { sort: 'display_order', limit: 50 }
    )
      .then((res) => {
        if (mounted) setCategories(res.items || []);
      })
      .catch((err) => console.error('Failed to load categories:', err));
    return () => {
      mounted = false;
    };
  }, []);

  if (!categories.length) return null;

  return (
    <section className="px-4">
      <h2 className="text-lg font-bold text-gray-900 mb-2">Shop by Category</h2>
      <div className="grid grid-cols-3 gap-2.5">
        {categories.map((cat, i) => {
          const slug =
            cat.slug ||
            cat.name
              ?.toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '');
          const imgSrc = cat.image_url || cat.image;

          return (
            <button
              key={cat.id || slug}
              onClick={() => navigate(`/shop/${slug}`)}
              className="bg-white rounded-2xl border border-gray-100 p-2.5 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
            >
              <div
                className={`w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center ${
                  tileColors[i % tileColors.length]
                }`}
              >
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">{cat.icon || '🛒'}</span>
                )}
              </div>
              <div className="text-center w-full">
                <p className="text-xs font-bold text-gray-900 leading-tight line-clamp-1">
                  {cat.name}
                </p>
                {cat.subtitle && (
                  <p className="text-[10px] text-gray-500 leading-tight line-clamp-1 mt-0.5">
                    {cat.subtitle}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
