import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BROAD_CATEGORIES } from '@/lib/broadCategories';
import { Image } from '@/components/ui/image';
import { usePageContent } from '@/lib/usePageContent';

export default function Categories() {
  const navigate = useNavigate();
  const { getField, isSectionVisible } = usePageContent('categories');

  const title = getField('title', 'Shop by Category');
  const subtitle = getField('subtitle', 'Browse all our grocery categories');

  return (
    <div className="uk-page">
      {isSectionVisible('header', true) && (
        <div className="mb-3">
          <h1 className="uk-title mb-0.5">{title}</h1>
          <p className="uk-sub">{subtitle}</p>
        </div>
      )}
      <div className="flex items-center justify-end mb-3">
        <span className="uk-meta-chip">{BROAD_CATEGORIES.length} categories</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {BROAD_CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => navigate(cat.route || `/shop/${cat.slug}`)}
            className="bg-card rounded-2xl border border-border p-2.5 flex flex-col items-center active:scale-95 transition-transform"
          >
            <div className="w-full aspect-square rounded-xl overflow-hidden bg-muted flex items-center justify-center mb-2">
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
            <span className="text-[12px] font-bold text-foreground leading-tight text-center line-clamp-1">
              {cat.name}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight mt-0.5 text-center line-clamp-1">
              {cat.example}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}