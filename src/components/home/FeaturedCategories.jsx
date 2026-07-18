import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function FeaturedCategories({ categories }) {
  const navigate = useNavigate();
  const cats = categories.filter((c) => c.slug !== 'packages');

  if (!cats.length) return null;

  return (
    <section className="px-4">
      <h2 className="text-lg font-bold text-gray-900 mb-3">Featured Categories</h2>
      <div className="grid grid-cols-2 gap-3">
        {cats.map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate(`/category/${cat.id}`)}
            className="relative h-28 rounded-2xl overflow-hidden"
          >
            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl mb-1">{cat.icon}</span>
              <span className="text-sm font-bold text-white">{cat.name}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}