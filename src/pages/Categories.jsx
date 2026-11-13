import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { usePageContent } from '@/lib/usePageContent';

export default function Categories() {
  const navigate = useNavigate();
  const { getField, isSectionVisible } = usePageContent('categories');
  const [categories, setCategories] = useState([]);

  const title = getField('title', 'Shop by Category');
  const subtitle = getField('subtitle', 'Browse all our grocery categories');

  useEffect(() => {
    let mounted = true;
    base44.entities.Category.filter(
      { is_hidden: { $ne: true } },
      { sort: 'display_order', limit: 100 }
    )
      .then((res) => {
        if (mounted) setCategories(res.items || []);
      })
      .catch((err) => console.error('Failed to load categories:', err));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="uk-page">
      {isSectionVisible('header', true) && (
        <div className="mb-3">
          <h1 className="uk-title mb-0.5">{title}</h1>
          <p className="uk-sub">{subtitle}</p>
        </div>
      )}
      <div className="flex items-center justify-end mb-3">
        <span className="uk-meta-chip">{categories.length} categories</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
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
              className="bg-card rounded-2xl border border-border p-2.5 flex flex-col items-center active:scale-95 transition-transform"
            >
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-muted flex items-center justify-center mb-2">
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">{cat.icon || '🛒'}</span>
                )}
              </div>
              <span className="text-[12px] font-bold text-foreground leading-tight text-center line-clamp-1">
                {cat.name}
              </span>
              {cat.subtitle && (
                <span className="text-[10px] text-muted-foreground leading-tight mt-0.5 text-center line-clamp-1">
                  {cat.subtitle}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
