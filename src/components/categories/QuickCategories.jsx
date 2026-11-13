import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function QuickCategories() {
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
      .catch((err) => console.error('Failed to load quick categories:', err));
    return () => {
      mounted = false;
    };
  }, []);

  if (!categories.length) return null;

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
      {categories.map((cat) => {
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
            onClick={() => navigate(cat.route || `/shop/${slug}`)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16 no-tap-highlight active:scale-90 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#E8F5E9] flex items-center justify-center">
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
            <span className="text-[10px] font-medium text-gray-700 text-center leading-tight line-clamp-2">
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
