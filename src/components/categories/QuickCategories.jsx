import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function QuickCategories({ categories }) {
  const navigate = useNavigate();

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 pt-3 -mx-4 px-4 scrollbar-hide">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => navigate(cat.slug === 'packages' ? '/packages' : `/category/${cat.id}`)}
          className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16 no-tap-highlight"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#E8F5E9] flex items-center justify-center text-2xl">
            {cat.icon}
          </div>
          <span className="text-[10px] font-medium text-gray-700 text-center leading-tight">
            {cat.name}
          </span>
        </button>
      ))}
    </div>
  );
}