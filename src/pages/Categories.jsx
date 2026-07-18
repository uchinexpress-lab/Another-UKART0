import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const gradients = [
  'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
  'linear-gradient(135deg, #F1F8E9, #DCEDC8)',
  'linear-gradient(135deg, #FFFDE7, #FFF9C4)',
  'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
  'linear-gradient(135deg, #FBE9E7, #FFCCBC)',
  'linear-gradient(135deg, #E0F7FA, #B2EBF2)',
  'linear-gradient(135deg, #F3E5F5, #E1BEE7)',
];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.Category.list('-display_order').then((cats) => {
      setCategories(cats);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#2E7D32] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Categories</h1>
      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat, i) => (
          <button
            key={cat.id}
            onClick={() => navigate(cat.slug === 'packages' ? '/packages' : `/category/${cat.id}`)}
            style={{ background: gradients[i % gradients.length] }}
            className="rounded-2xl p-4 h-32 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <span className="text-4xl">{cat.icon}</span>
            <span className="text-sm font-bold text-gray-700">{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}