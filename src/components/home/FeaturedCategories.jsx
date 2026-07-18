import React from 'react';
import { useNavigate } from 'react-router-dom';

const gradients = [
  'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
  'linear-gradient(135deg, #F1F8E9, #DCEDC8)',
  'linear-gradient(135deg, #FFFDE7, #FFF9C4)',
  'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
  'linear-gradient(135deg, #FBE9E7, #FFCCBC)',
  'linear-gradient(135deg, #E0F7FA, #B2EBF2)',
];

export default function FeaturedCategories({ categories }) {
  const navigate = useNavigate();
  const cats = categories.filter((c) => c.slug !== 'packages');

  if (!cats.length) return null;

  return (
    <section className="px-4">
      <h2 className="text-lg font-bold text-gray-900 mb-3">Featured Categories</h2>
      <div className="grid grid-cols-3 gap-3">
        {cats.map((cat, i) => (
          <button
            key={cat.id}
            onClick={() => navigate(`/category/${cat.id}`)}
            style={{ background: gradients[i % gradients.length] }}
            className="rounded-2xl p-3 h-24 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform"
          >
            <span className="text-3xl">{cat.icon}</span>
            <span className="text-[11px] font-semibold text-gray-700 text-center leading-tight">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}